import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-shopify-session-token",
};

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Get the session token from the request headers
    const sessionToken =
      request.headers.get("x-shopify-session-token") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: "No session token provided",
          message:
            "Please provide a valid Shopify session token in the x-shopify-session-token header",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    console.log("sessionToken", sessionToken);

    // Create a new request with the session token in the authorization header
    // This is required by the verifyRequest function
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
    });

    // Set the authorization header with Bearer prefix for verifyRequest
    modifiedRequest.headers.set("authorization", `Bearer ${sessionToken}`);

    // Verify the session token and get shop/access token
    console.log("verifying session");
    const { shop, session } = await verifyRequest(modifiedRequest, true);

    if (!shop || !session.accessToken) {
      return NextResponse.json(
        {
          error: "Invalid session token",
          message: "The provided session token is invalid or has expired",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    // Return the verified session information
    return NextResponse.json(
      {
        success: true,
        shop,
        accessToken: session.accessToken,
        sessionId: session.id,
        isOnline: session.isOnline,
        expires: session.expires,
        scope: session.scope,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.info("Error verifying session:", error);

    // Handle specific error types with detailed messages
    if (error instanceof Error) {
      if (error.message.includes("No bearer or session token present")) {
        return NextResponse.json(
          {
            error: "Invalid session token format",
            message:
              "Session token must be provided in the x-shopify-session-token header",
          },
          {
            status: 401,
            headers: corsHeaders,
          },
        );
      }

      if (
        error.message.includes("Invalid Compact JWS") ||
        error.message.includes("InvalidJwtError")
      ) {
        return NextResponse.json(
          {
            error: "Invalid session token format",
            message:
              "The provided token is not a valid Shopify session token. Please ensure you're using the correct token from App Bridge.",
          },
          {
            status: 401,
            headers: corsHeaders,
          },
        );
      }

      if (error.message.includes("Session not found")) {
        return NextResponse.json(
          {
            error: "Session not found or expired",
            message:
              "The session has expired or does not exist. Please re-authenticate with Shopify.",
          },
          {
            status: 401,
            headers: corsHeaders,
          },
        );
      }

      if (error.message.includes("Token expired")) {
        return NextResponse.json(
          {
            error: "Session token expired",
            message:
              "Your session has expired. Please re-authenticate with Shopify.",
          },
          {
            status: 401,
            headers: corsHeaders,
          },
        );
      }

      if (error.message.includes("Scope mismatch")) {
        return NextResponse.json(
          {
            error: "Insufficient permissions",
            message:
              "Your session does not have the required permissions for this operation.",
          },
          {
            status: 403,
            headers: corsHeaders,
          },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to verify session",
        message:
          "An unexpected error occurred while verifying your session. Please try again.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way as GET
  return GET(request);
}
