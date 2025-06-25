import {
  AbortMultipartUploadRequest,
  CompleteMultipartUploadRequest,
  CreateMultipartUploadRequest,
  CreateMultiPartUploadResponse,
  GetPreSignedUrlRequest,
  GetPreSignedUrlResponse,
  GetUploadPartPresignedUrlResponse,
  GetUploadPartsPresignedUrlsRequest,
} from "@/lib/uploader/type";
import {
  AbortMultipartUploadCommandInput,
  CompleteMultipartUploadCommandInput,
  CreateMultipartUploadCommandInput,
  S3,
  UploadPartCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Lazy initialization to prevent build-time issues with placeholder values
let s3Instance: S3 | null = null;
let s3Bucket: string | null = null;

function getS3Instance(): S3 {
  if (s3Instance) return s3Instance;
  
  // Skip validation during build time
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a dummy instance for build time
    s3Instance = new S3({
      credentials: {
        accessKeyId: "dummy",
        secretAccessKey: "dummy",
      },
      region: "us-east-1",
      endpoint: "https://dummy.s3.amazonaws.com",
    });
    return s3Instance;
  }
  
  // Validate that we have real values (not placeholders) at runtime
  const accessKeyId = process.env.S3_ACCESS_ID;
  const secretAccessKey = process.env.S3_ACCESS_KEY;
  
  if (!accessKeyId || accessKeyId === "placeholder_access_id" || 
      !secretAccessKey || secretAccessKey === "placeholder_access_key") {
    throw new Error("S3 credentials not properly configured");
  }
  
  s3Instance = new S3({
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
  });
  
  return s3Instance;
}

function getS3Bucket(): string {
  if (s3Bucket) return s3Bucket;
  
  // Skip validation during build time
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    s3Bucket = "dummy-bucket";
    return s3Bucket;
  }
  
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET not configured");
  }
  
  s3Bucket = bucket;
  return s3Bucket;
}

// Export getter functions instead of instances directly
export function getS3() {
  return getS3Instance();
}

export function getS3BucketName() {
  return getS3Bucket();
}

console.log(process.env);

export class StorageService {
  prefix: string;
  constructor(filePrefix: string = "") {
    this.prefix = filePrefix;
  }

  async createMultipartUpload(
    dto: CreateMultipartUploadRequest,
  ): Promise<CreateMultiPartUploadResponse> {
    const key = this.getFileKey(dto);
    const params: CreateMultipartUploadCommandInput = {
      Bucket: getS3BucketName(),
      Key: String(key),
    };

    const response = await getS3().createMultipartUpload(params);
    const { UploadId: uploadId, Key } = response;
    if (!uploadId || !Key) {
      throw new Error("Please try later!");
    }
    return { uploadId, key: Key };
  }

  async getUploadPartPresignedUrls(
    dto: GetUploadPartsPresignedUrlsRequest,
  ): Promise<GetUploadPartPresignedUrlResponse[]> {
    const preSignedUrls = Array.from(
      { length: dto.numberOfParts },
      (_, i) => i + 1,
    ).map(async (partNumber) => {
      const params: UploadPartCommandInput = {
        Bucket: getS3BucketName(),
        Key: dto.key,
        UploadId: dto.uploadId,
        PartNumber: partNumber,
      };
      const command = new UploadPartCommand(params);
      const preSignedUrl = await getSignedUrl(getS3(), command, {
        expiresIn: 60 * 60,
      });
      return { partNumber, preSignedUrl };
    });

    return Promise.all(preSignedUrls);
  }

  async completeMultiPart(dto: CompleteMultipartUploadRequest) {
    const params: CompleteMultipartUploadCommandInput = {
      Bucket: getS3BucketName(),
      Key: dto.key,
      UploadId: dto.uploadId,
      MultipartUpload: {
        Parts: dto.parts,
      },
    };

    return await getS3().completeMultipartUpload(params);
  }

  async getPreSignedUrl(
    dto: GetPreSignedUrlRequest,
  ): Promise<GetPreSignedUrlResponse> {
    const key = this.getFileKey(dto);
    const params: PutObjectCommandInput = {
      Bucket: getS3BucketName(),
      Key: key,
      ContentType: dto.contentType,
    };
    const command = new PutObjectCommand(params);
    return {
      key,
      preSignedUrl: await getSignedUrl(getS3(), command, { expiresIn: 60 * 60 }),
    };
  }

  async abortMultiPartUpload(dto: AbortMultipartUploadRequest) {
    const params: AbortMultipartUploadCommandInput = {
      Bucket: getS3BucketName(),
      Key: dto.key,
      UploadId: dto.uploadId,
    };

    return await getS3().abortMultipartUpload(params);
  }

  getFileKey(dto: { fileName: string }) {
    const uuid = uuidv4();
    const key = `${uuid}_${dto.fileName}`;
    if (this.prefix.length) {
      return `${this.prefix}/${key}`;
    }
    return key;
  }
}
