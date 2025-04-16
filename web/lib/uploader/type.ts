import * as z from "zod";
import { UploadApiClient, UploadProgress } from "./uploader";
import { TUploaderBenchmark } from "./uploader.benchmark";

export const CreateMultipartUploadRequestSchema = z.object({
  fileName: z.string().min(1, { message: "file name required!" }),
});

export type CreateMultiPartUploadResponse = {
  uploadId: string;
  key: string;
};
export const GetUploadPartsPresignedUrlsRequestSchema = z.object({
  key: z.string().min(1, { message: "key required!" }),
  uploadId: z.string({
    required_error: "uploadId is required",
    invalid_type_error: "uploadId must be a string",
  }),
  numberOfParts: z.number({
    required_error: "partNumber is required",
  }),
  contentType: z.string({
    required_error: "contentType is required",
  }),
});

export type GetUploadPartPresignedUrlResponse = {
  partNumber: number;
  preSignedUrl: string;
};

export const CompleteMultipartUploadRequestSchema = z.object({
  key: z.string().min(1, { message: "key required!" }),
  uploadId: z.string({
    required_error: "uploadId is required",
    invalid_type_error: "uploadId must be a string",
  }),
  parts: z.array(
    z.object({
      PartNumber: z.number({
        required_error: "partNumber is required",
      }),
      ETag: z.string(),
    }),
  ),
});

export const GetPreSignedUrlRequestSchema = z.object({
  fileName: z.string().min(1, { message: "file name required!" }),
  contentType: z.string({
    required_error: "contentType is required",
  }),
});

export type GetPreSignedUrlResponse = {
  key: string;
  preSignedUrl: string;
};

export const AbortMultipartUploadRequestSchema = z.object({
  key: z.string().min(1, { message: "file name required!" }),
  uploadId: z.string({
    required_error: "uploadId is required",
    invalid_type_error: "uploadId must be a string",
  }),
});

export type MultiPartUploadOptions = {
  chunkSize?: number;
  threadsQuantity?: number;
  partRetryCount?: number;
};

export type UploaderOptions = {
  file: File;
  fileName: string;
  apiClient: UploadApiClient;
  multiPartUploadOptions?: MultiPartUploadOptions;
  fileUploadRetryCount?: number;
  timeout?: number;
  enableBenchmark?: boolean;
};

export type FileUploadingModalMeta = {
  previewFiles: File[];
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  completed?: boolean;
  uploadedFile: Set<string>;
};
export type UploadingProgressMeta = {
  id: string;
  progress: number;
};
export type ProgressEvent = {
  loaded: number;
  total: number;
};

export type UploaderCompleteFunc = (
  key: string,
  benchmark?: TUploaderBenchmark,
) => void;

export type FileInfo = {
  fileName: string;
  fileObject: File;
};

export type FileUploaderOptions = Omit<UploaderOptions, "file" | "fileName"> & {
  files: FileInfo[];
};

export type FileUploaderProgressFunc = (payload: {
  id: string;
  fileName: string;
  uploadProgress: UploadProgress;
}) => void;
export type SingleFileCompleteFunc = (key: string, file: File) => void;

export type GetUploadPartsPresignedUrlsRequest = z.infer<
  typeof GetUploadPartsPresignedUrlsRequestSchema
>;
export type CreateMultipartUploadRequest = z.infer<
  typeof CreateMultipartUploadRequestSchema
>;
export type CompleteMultipartUploadRequest = z.infer<
  typeof CompleteMultipartUploadRequestSchema
>;

export type GetPreSignedUrlRequest = z.infer<
  typeof GetPreSignedUrlRequestSchema
>;

export type AbortMultipartUploadRequest = z.infer<
  typeof AbortMultipartUploadRequestSchema
>;

export interface IFile {
  id?: string;
  key: string;
  fullPath: string;
  url: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  ext: string;
  mime: string;
  thumbHash?: number[] | null;
  thumbnailUrl?: string | null;
  resizeUrl?: string | null;
  createdAt?: string;
}
