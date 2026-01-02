import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";
import { getImageFetchUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { session } = await verifyRequest(req, true);
    const { productId, image, filename } = await req.json();

    if (!productId || !image) {
      return NextResponse.json(
        { error: "Missing productId or image" },
        { status: 400 },
      );
    }

    const client = new (shopify().clients.Graphql)({ session });

    // Note: To attach to a product, we use productCreateMedia.
    // We can pass the originalSource directly if it's a public URL.
    // If it's a generated image URL from our app, it should be accessible.

    const productCreateMediaQuery = `
      mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
        productCreateMedia(media: $media, productId: $productId) {
          media {
            id
            status
            ... on MediaImage {
              image {
                url
              }
            }
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `;

    let imageUrl = await getImageFetchUrl(image);

    const mediaInput = {
      originalSource: imageUrl,
      mediaContentType: "IMAGE",
      alt: filename || "AI Generated Image",
    };

    // Ensure productId is a valid GID
    const formattedProductId = productId.toString().startsWith("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const result = await client.request(productCreateMediaQuery, {
      variables: {
        media: [mediaInput],
        productId: formattedProductId,
      },
    });

    const data = result.data as any;

    if (data?.productCreateMedia?.mediaUserErrors?.length > 0) {
      const error = data.productCreateMedia.mediaUserErrors
        .map((e: any) => e.message)
        .join(", ");
      console.log(error);
      throw new Error(error);
    }

    return NextResponse.json({
      success: true,
      media: data.productCreateMedia.media[0],
    });
  } catch (error) {
    console.error("Product Media Attach Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
