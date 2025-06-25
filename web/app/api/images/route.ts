import { verifyRequest } from "@/lib/shopify/verify";
import {
  AbortMultipartUploadRequest,
  CompleteMultipartUploadRequest,
  CreateMultipartUploadRequest,
  GetPreSignedUrlRequest,
  GetUploadPartsPresignedUrlsRequest,
} from "@/lib/uploader/type";
import { NextRequest, NextResponse } from "next/server";
import { StorageService, getS3 } from "./service";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type ResponseData = {
  url: string;
};

export async function GET(req: NextRequest): Promise<Response> {
  try {
    verifyRequest(req, true);
    const searchParams = req.nextUrl.searchParams;
    const urlWithBucket = searchParams
      .get("url")
      ?.replace("s3://", "")
      .split("/");
    if (!urlWithBucket) {
      throw new Error("Invalid URL");
    }
    const Bucket = urlWithBucket.shift();
    const Key = urlWithBucket.join("/");
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });

    const url = await getSignedUrl(getS3(), command);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error fetching image from S3:", error);
    return new Response("Error fetching image from S3");
  }
}
export async function POST(req: NextRequest, res: NextResponse) {
  const { shop } = await verifyRequest(req, true);
  const {
    command,
    payload,
  }: {
    command: string;
    payload: Record<string, unknown>;
  } = await req.json();
  const storageServer = new StorageService(shop);
  switch (command) {
    case "getPreSignedUrl":
      const preSignedUrl = await storageServer.getPreSignedUrl(
        payload as GetPreSignedUrlRequest,
      );
      return NextResponse.json(preSignedUrl);
    case "createMultipartUpload":
      const createMultipartUploadResponse =
        await storageServer.createMultipartUpload(
          payload as CreateMultipartUploadRequest,
        );
      return NextResponse.json(createMultipartUploadResponse);
    case "getUploadPartPresignedUrls":
      const uploadPartPresignedUrls =
        await storageServer.getUploadPartPresignedUrls(
          payload as GetUploadPartsPresignedUrlsRequest,
        );
      return NextResponse.json(uploadPartPresignedUrls);
    case "completeMultipartUpload":
      const completeMultipartUploadResponse =
        await storageServer.completeMultiPart(
          payload as CompleteMultipartUploadRequest,
        );
      return NextResponse.json(completeMultipartUploadResponse);
    case "abortMultiPartUpload":
      const abortMultipartUploadResponse =
        await storageServer.abortMultiPartUpload(
          payload as AbortMultipartUploadRequest,
        );
      return NextResponse.json(abortMultipartUploadResponse);
    default:
      return NextResponse.json({ message: "Invalid command" }, { status: 400 });
  }
}
