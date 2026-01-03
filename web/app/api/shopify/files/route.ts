import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";

export async function GET(req: NextRequest) {
  try {
    const { session } = await verifyRequest(req, true);
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");

    const client = new (shopify().clients.Graphql)({ session });

    const filesQuery = `
      query getFiles($first: Int!, $after: String) {
        files(first: $first, after: $after, query: "file_attributes.extension:png OR file_attributes.extension:jpg OR file_attributes.extension:jpeg") {
          edges {
            node {
              id
              createdAt
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const result = await client.request(filesQuery, {
      variables: {
        first: 20,
        after: cursor,
      },
    });

    const data = result.data as any;
    const files =
      data?.files?.edges
        .map((edge: any) => ({
          id: edge.node.id,
          url: edge.node.image?.url || "",
          createdAt: edge.node.createdAt,
        }))
        .filter((f: any) => f.url !== "") || [];

    return NextResponse.json({
      success: true,
      files,
      pageInfo: data?.files?.pageInfo,
    });
  } catch (error) {
    console.error("Shopify Files Fetch Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
