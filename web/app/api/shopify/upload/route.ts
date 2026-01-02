import { NextRequest, NextResponse } from "next/server";
import { verifyRequest } from "@/lib/shopify/verify";
import shopify from "@/lib/shopify/initialize-context";
import { getImageFetchUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { session } = await verifyRequest(req, true);
    const { url, filename } = await req.json();

    if (!url || !filename) {
      return NextResponse.json(
        { error: "Missing url or filename" },
        { status: 400 },
      );
    }

    const client = new (shopify().clients.Graphql)({ session });

    // 1. Staged Upload Create
    const stagedUploadsCreateQuery = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const stagedUploadInput = {
      filename,
      mimeType: "image/png",
      httpMethod: "POST",
      resource: "FILE",
    };

    const stagedResult = await client.request(stagedUploadsCreateQuery, {
      variables: { input: [stagedUploadInput] },
    });

    const stagedData = stagedResult.data as any;
    if (stagedData?.stagedUploadsCreate?.userErrors?.length > 0) {
      throw new Error(
        stagedData.stagedUploadsCreate.userErrors
          .map((e: any) => e.message)
          .join(", "),
      );
    }

    const target = stagedData?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!target) {
      throw new Error("Failed to get staged upload target");
    }

    const params = target.parameters;
    const uploadUrl = target.url;
    const resourceUrl = target.resourceUrl;

    // 2. Fetch image data
    let imageUrl = await getImageFetchUrl(url);
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // 3. Upload to Shopify Stage
    const formData = new FormData();
    params.forEach(({ name, value }: { name: string; value: string }) => {
      formData.append(name, value);
    });
    formData.append("file", imageBlob);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      console.error("Upload failure:", text);
      throw new Error("Failed to upload to Shopify stage");
    }

    // 4. Create File in Shopify
    const fileCreateQuery = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            ... on MediaImage {
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fileCreateResult = await client.request(fileCreateQuery, {
      variables: {
        files: [
          {
            originalSource: resourceUrl,
            contentType: "IMAGE",
            filename: filename,
          },
        ],
      },
    });

    const fileData = fileCreateResult.data as any;
    if (fileData?.fileCreate?.userErrors?.length > 0) {
      throw new Error(
        fileData.fileCreate.userErrors.map((e: any) => e.message).join(", "),
      );
    }

    return NextResponse.json({
      success: true,
      file: fileData.fileCreate.files[0],
    });
  } catch (error) {
    console.error("Shopify Upload Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
