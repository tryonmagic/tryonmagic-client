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

export const s3 = new S3({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_ID!,
    secretAccessKey: process.env.S3_ACCESS_KEY!,
  },
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
});

console.log(process.env);

const S3_BUCKET = process.env.S3_BUCKET;

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
      Bucket: S3_BUCKET,
      Key: String(key),
    };

    const response = await s3.createMultipartUpload(params);
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
        Bucket: S3_BUCKET,
        Key: dto.key,
        UploadId: dto.uploadId,
        PartNumber: partNumber,
      };
      const command = new UploadPartCommand(params);
      const preSignedUrl = await getSignedUrl(s3, command, {
        expiresIn: 60 * 60,
      });
      return { partNumber, preSignedUrl };
    });

    return Promise.all(preSignedUrls);
  }

  async completeMultiPart(dto: CompleteMultipartUploadRequest) {
    const params: CompleteMultipartUploadCommandInput = {
      Bucket: S3_BUCKET,
      Key: dto.key,
      UploadId: dto.uploadId,
      MultipartUpload: {
        Parts: dto.parts,
      },
    };

    return await s3.completeMultipartUpload(params);
  }

  async getPreSignedUrl(
    dto: GetPreSignedUrlRequest,
  ): Promise<GetPreSignedUrlResponse> {
    const key = this.getFileKey(dto);
    const params: PutObjectCommandInput = {
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: dto.contentType,
    };
    const command = new PutObjectCommand(params);
    return {
      key,
      preSignedUrl: await getSignedUrl(s3, command, { expiresIn: 60 * 60 }),
    };
  }

  async abortMultiPartUpload(dto: AbortMultipartUploadRequest) {
    const params: AbortMultipartUploadCommandInput = {
      Bucket: S3_BUCKET,
      Key: dto.key,
      UploadId: dto.uploadId,
    };

    return await s3.abortMultipartUpload(params);
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
