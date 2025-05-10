import axios, {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";
import { s3UploadAPIClient } from "@/lib/api";

import {
  AbortMultipartUploadRequest,
  CompleteMultipartUploadRequest,
  CreateMultipartUploadRequest,
  CreateMultiPartUploadResponse,
  FileInfo,
  FileUploaderOptions,
  FileUploaderProgressFunc,
  GetPreSignedUrlRequest,
  GetPreSignedUrlResponse,
  GetUploadPartPresignedUrlResponse,
  GetUploadPartsPresignedUrlsRequest,
  MultiPartUploadOptions,
  SingleFileCompleteFunc,
  UploaderCompleteFunc,
  UploaderOptions,
} from "./type";
import {
  FileUploaderBenchmark,
  TUploaderBenchmark,
  UploaderBenchmark,
} from "./uploader.benchmark";

interface Part {
  partNumber: number;
  preSignedUrl: string;
}

export interface Progress {
  sent: number;
  percentage: number;
}

export type UploadProgress = Progress & {
  multiPartUploadProgress?: MultiPartUploadProgress;
};

export type MultiPartUploadProgress = Record<
  number,
  Progress & {
    partSize: number;
  }
>;

export enum FileTypes {
  image = "image",
  video = "video",
  other = "other",
}
export type FileType = keyof typeof FileTypes;

type UploadedPart = { PartNumber: number; ETag: string };

export type ProgressFunc = (payload: {
  key: string;
  fileName: string;
  progress: UploadProgress;
}) => void;
type VoidFunc = () => void;
type ErrorFunc = (err: unknown) => void;

export abstract class UploadApiClient {
  abstract getUploadPresignedUrl(
    getUploadPresignedUrlRequest: GetPreSignedUrlRequest,
  ): Promise<GetPreSignedUrlResponse>;
  abstract createMultiPartUpload(
    createMultiPartUploadRequest: CreateMultipartUploadRequest,
  ): Promise<CreateMultiPartUploadResponse>;
  abstract getUploadPartsPresignedUrls(
    getUploadPartsPresignedUrlsRequest: GetUploadPartsPresignedUrlsRequest,
  ): Promise<GetUploadPartPresignedUrlResponse[]>;
  abstract completeMultipartUpload(
    completeMultipartUploadRequest: CompleteMultipartUploadRequest,
  ): Promise<void>;
  abstract abortMultiPartUpload(
    abortMultiPartUpload: AbortMultipartUploadRequest,
  ): Promise<void>;
}

class ChunkUploadFailedError extends Error {
  partNumber: number;
  constructor(partNumber: number) {
    super(`Failed chunk upload, partNumber : ${partNumber}`);
    this.partNumber = partNumber;
  }
}

class MaxRetryAttemptExitError extends Error {}
class PartMaxRetryAttemptExitError extends MaxRetryAttemptExitError {
  partNumber: number;
  constructor(partNumber: number) {
    super(
      `Max retry exists for partNumber : ${partNumber}, Aborting the upload`,
    );
    this.partNumber = partNumber;
  }
}

class MultipartBadError extends Error {}

const MULTI_PART_MIN_SIZE = 1024 * 1024 * 5;
const DEFAULT_TIMEOUT = 5 * 60 * 1000;
export class Uploader {
  private file: File;
  private key: string;
  private uploadedSize: number;
  private fileUploadRetryCount: number;
  private fileUploadRetryAttempts: number;
  private multiPartUploadProgress: MultiPartUploadProgress;
  private activeConnections: Record<number, XMLHttpRequest | AbortController>;
  private parts: Part[];
  private uploadedParts: UploadedPart[];
  private uploadId: string | null;
  private apiClient: UploadApiClient;
  private partsRetryAttempts: Record<number, number>;
  private multiPartUploadOptions: Required<MultiPartUploadOptions>;
  private onCompleteFn: UploaderCompleteFunc;
  private onProgressFn: ProgressFunc;
  private onErrorFn: ErrorFunc;
  private onUploadFailedFn: VoidFunc;
  private aborted: boolean;
  private timeout: number;
  private benchmark?: UploaderBenchmark;
  private enableBenchmark: boolean;

  static getDefaultMultiPartUploadOptions(): MultiPartUploadOptions {
    return {
      chunkSize: MULTI_PART_MIN_SIZE,
      threadsQuantity: 5,
      partRetryCount: 3,
    };
  }
  constructor(options: UploaderOptions) {
    this.file = options.file;
    this.key = options.fileName || options.file.name;
    const multiPartUploadOptions = options.multiPartUploadOptions || {};
    this.multiPartUploadOptions = {
      chunkSize: Math.max(
        multiPartUploadOptions.chunkSize || MULTI_PART_MIN_SIZE,
        MULTI_PART_MIN_SIZE,
      ),
      threadsQuantity: Math.min(
        multiPartUploadOptions.threadsQuantity || 5,
        15,
      ),
      partRetryCount: Math.min(multiPartUploadOptions.partRetryCount || 3, 10),
    };
    this.fileUploadRetryCount = Math.min(options.fileUploadRetryCount || 3, 10);
    this.apiClient = options.apiClient;
    this.uploadedSize = 0;
    this.multiPartUploadProgress = {};
    this.activeConnections = {};
    this.partsRetryAttempts = {};
    this.fileUploadRetryAttempts = 0;
    this.parts = [];
    this.uploadedParts = [];
    this.uploadId = null;
    this.aborted = false;
    this.enableBenchmark = options.enableBenchmark ?? false;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.onProgressFn = () => {};
    this.onErrorFn = console.error;
    this.onCompleteFn = () => {};
    this.onUploadFailedFn = () => {};
  }

  getFileType(): FileType {
    const fileType = this.file.type.split("/")[0] as keyof typeof FileTypes;
    return FileTypes[fileType] ?? FileTypes.other;
  }
  start() {
    const isMultiPart = this.file.size >= MULTI_PART_MIN_SIZE;

    if (this.enableBenchmark) {
      this.benchmark = new UploaderBenchmark({
        fileName: this.key,
        size: this.file.size,
        fileType: this.getFileType(),
        isMultiPart,
        totalParts: this.getNumberOfMultiParts(),
      });
    }
    if (isMultiPart) {
      this.initializeMultiPartUpload();
      return;
    }
    this.uploadSingle();
  }

  getNumberOfMultiParts() {
    return (
      Math.floor(this.file.size / this.multiPartUploadOptions.chunkSize) + 1
    );
  }

  async initializeMultiPartUpload() {
    try {
      const { uploadId: uploadId, key } =
        await this.apiClient.createMultiPartUpload({
          fileName: this.key,
        });
      if (!uploadId) {
        this.onErrorFn(
          new MultipartBadError(
            "[ApiClient:createMultiPartUpload] uploadId must be valid string",
          ),
        );
        return;
      }
      this.uploadId = uploadId;
      this.key = key;
      const numberOfParts = this.getNumberOfMultiParts();
      const partNumberWithPresignedUrl =
        await this.apiClient.getUploadPartsPresignedUrls({
          uploadId: uploadId,
          key,
          numberOfParts,
          contentType: this.file.type,
        });
      if (
        !partNumberWithPresignedUrl ||
        !Array.isArray(partNumberWithPresignedUrl) ||
        partNumberWithPresignedUrl.length !== numberOfParts
      ) {
        this.onErrorFn(
          new MultipartBadError(
            `[ApiClient:getUploadPartsPresignedUrls] api response numberOfParts doesn't match with requested multipart.requested ${numberOfParts} but get ${partNumberWithPresignedUrl?.length}`,
          ),
        );
        return;
      }
      this.parts = partNumberWithPresignedUrl;

      this.sendNextPart();
    } catch (error) {
      this.onErrorFn(error);
    }
  }

  sendNextPart() {
    const activeConnections = Object.keys(this.activeConnections).length;

    if (activeConnections >= this.multiPartUploadOptions.threadsQuantity) {
      return;
    }

    if (!this.parts.length) {
      if (!activeConnections) {
        this.completeMultipartUpload();
      }
      return;
    }

    const part = this.parts.pop();

    if (part) {
      const sentSize =
        (part.partNumber - 1) * this.multiPartUploadOptions.chunkSize;
      const chunk = this.file.slice(
        sentSize,
        sentSize + this.multiPartUploadOptions.chunkSize,
      );

      const sendChunkStarted = () => {
        this.sendNextPart();
      };

      this.sendChunk(chunk, part, sendChunkStarted)
        .then(() => {
          this.sendNextPart();
        })
        .catch((error) => {
          console.log(error);
          const retryCount = this.partsRetryAttempts[part.partNumber] ?? 0;
          if (retryCount >= this.multiPartUploadOptions.partRetryCount) {
            this.abort();
            this.onErrorFn(new PartMaxRetryAttemptExitError(part.partNumber));
            this.uploadFailed(part.partNumber);
            return;
          }

          this.parts.push(part);
          this.partsRetryAttempts[part.partNumber] = retryCount + 1;
          this.onErrorFn(error);
          this.sendNextPart();
        });
    }
  }

  async completeMultipartUpload() {
    try {
      if (this.uploadId) {
        await this.apiClient.completeMultipartUpload({
          uploadId: this.uploadId,
          key: this.key,
          parts: this.uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber),
        });
        this.completeUpload();
      }
    } catch (error) {
      this.onErrorFn(error);
    }
  }

  sendChunk(chunk: Blob, part: Part, sendChunkStarted: VoidFunc) {
    return new Promise((resolve, reject) => {
      const partBenchMark = this.benchmark?.addPartBenchmark(
        part.partNumber,
        chunk.size,
      );

      this.uploadAxios(chunk, part, sendChunkStarted)
        .then((status) => {
          if (status !== 200) {
            reject(new ChunkUploadFailedError(part.partNumber));
            return;
          }
          partBenchMark?.complete({
            partNumber: part.partNumber,
            retryAttempts: this.partsRetryAttempts[part.partNumber] ?? 0,
            success: true,
          });
          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private handleProgress(
    part: number,
    event: ProgressEvent<XMLHttpRequestEventTarget>,
  ) {
    if (
      event.type === "progress" ||
      event.type === "error" ||
      event.type === "abort"
    ) {
      this.multiPartUploadProgress[part] = {
        sent: event.loaded,
        percentage: 0,
        partSize: event.total,
      };
    }

    if (event.type === "uploaded") {
      this.uploadedSize += this.multiPartUploadProgress[part].sent || 0;
      delete this.multiPartUploadProgress[part];
    }

    const inProgress = Object.keys(this.multiPartUploadProgress)
      .map(Number)
      .reduce((memo, id) => (memo += this.multiPartUploadProgress[id].sent), 0);
    this.updateProgress(this.uploadedSize + inProgress);
  }

  private updateProgress(
    loaded: number,
    multiPartUploadProgress?: MultiPartUploadProgress,
  ) {
    const sent = Math.min(loaded, this.file.size);

    const total = this.file.size;

    const percentage = Math.round((sent / total) * 100);

    const progress = {
      sent,
      percentage,
      multiPartUploadProgress,
    };
    this.onProgressFn({
      key: this.key,
      fileName: this.file.name,
      progress,
    });
  }

  async uploadSingle() {
    try {
      const contentType = this.file.type;
      const { preSignedUrl, key } = await this.apiClient.getUploadPresignedUrl({
        fileName: this.key,
        contentType,
      });
      if (!preSignedUrl) {
        this.onErrorFn(
          new MultipartBadError(
            `[ApiClient:getUploadPresignedUrl] preSignedUrl must be valid url`,
          ),
        );
        return;
      }
      this.key = key;
      const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded / this.file.size) * 100,
        );
        this.onProgressFn({
          key: this.key,
          fileName: this.file.name,
          progress: {
            sent: progressEvent.loaded,
            percentage: progress,
          },
        });
      };

      const config: AxiosRequestConfig = {
        onUploadProgress,
        timeout: this.timeout,
      };
      const uploadFile = async () => {
        try {
          await axios.put(preSignedUrl, this.file, config);
          this.completeUpload();
        } catch (error) {
          this.onErrorFn(error);
          if (this.fileUploadRetryAttempts >= this.fileUploadRetryCount) {
            this.abort();
            this.onErrorFn(
              new MaxRetryAttemptExitError("Maximum retry attempts reached"),
            );
            this.uploadFailed();
            return;
          }
          this.fileUploadRetryAttempts += 1;
          await uploadFile();
        }
      };
      await uploadFile();
    } catch (error) {
      this.onErrorFn(error);
    }
  }
  async uploadBySinglePresignedUrl(): Promise<number> {
    let preSignedUrl = "";
    const contentType = this.file.type;
    try {
      const { preSignedUrl: url, key } =
        await this.apiClient.getUploadPresignedUrl({
          fileName: this.key,
          contentType,
        });
      preSignedUrl = url;
      this.key = key;
    } catch (error) {
      this.onErrorFn(error);
    }
    if (!preSignedUrl) this.onErrorFn(new Error("Something went wrong!"));
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const progressListener = (
        event: ProgressEvent<XMLHttpRequestEventTarget>,
      ) => {
        this.updateProgress(event.loaded);
      };

      xhr.upload.addEventListener("progress", progressListener);

      xhr.open("PUT", preSignedUrl);
      xhr.setRequestHeader("Content-Type", contentType);

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            this.completeUpload();
            resolve(xhr.status);
          } else {
            reject(new Error("Failed to upload file"));
          }
        }
      };

      xhr.onerror = (error) => {
        reject(error);
      };

      xhr.onabort = () => {
        reject(new Error("Upload canceled by user"));
      };

      xhr.send(this.file);
    });
  }

  upload(file: Blob, part: Part, sendChunkStarted: VoidFunc): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.uploadId) {
        reject(new Error("Something went wrong!"));
      }
      const partNumber = part.partNumber;
      const xhr = new XMLHttpRequest();
      this.activeConnections[partNumber - 1] = xhr; // Store XMLHttpRequest by partNumber

      sendChunkStarted();

      const progressListener = this.handleProgress.bind(this, partNumber - 1);

      xhr.upload.addEventListener("progress", progressListener);
      xhr.addEventListener("error", progressListener);
      xhr.addEventListener("abort", progressListener);
      xhr.addEventListener("loadend", progressListener);

      xhr.open("PUT", part.preSignedUrl);

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            const ETag = xhr.getResponseHeader("ETag");
            if (ETag) {
              const uploadedPart = {
                PartNumber: partNumber,
                ETag: ETag.replace(/"/g, ""),
              };
              this.uploadedParts.push(uploadedPart);
              resolve(xhr.status);
            }
          } else {
            reject(new Error("Failed to upload part"));
          }
          delete this.activeConnections[partNumber - 1];
        }
      };

      xhr.onerror = (error) => {
        reject(error);
        delete this.activeConnections[partNumber - 1];
      };
      xhr.timeout = this.timeout;

      xhr.onabort = () => {
        reject(new Error("Upload canceled by user"));
        delete this.activeConnections[partNumber - 1];
      };

      xhr.send(file);
    });
  }

  uploadAxios(
    file: Blob,
    part: Part,
    sendChunkStarted: VoidFunc,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.uploadId) {
        reject(new Error("Something went wrong!"));
      }
      const partNumber = part.partNumber;
      const controller = new AbortController();
      this.activeConnections[partNumber - 1] = controller; // Store XMLHttpRequest by partNumber
      sendChunkStarted();

      const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
        const partSize = file.size ?? 0;
        this.multiPartUploadProgress[part.partNumber] = {
          sent: progressEvent.loaded,
          percentage: partSize
            ? Math.round((progressEvent.loaded / partSize) * 100)
            : 0,
          partSize,
        };
        const inProgress = Object.keys(this.multiPartUploadProgress)
          .map(Number)
          .reduce(
            (memo, id) => (memo += this.multiPartUploadProgress[id].sent),
            0,
          );
        this.updateProgress(inProgress, {
          [partNumber]: {
            sent: progressEvent.loaded,
            percentage: partSize
              ? Math.round((progressEvent.loaded / partSize) * 100)
              : 0,
            partSize,
          },
        });
      };
      const config: AxiosRequestConfig = {
        onUploadProgress,
        timeout: this.timeout,
        signal: controller.signal,
      };

      axios
        .put(part.preSignedUrl, file, config)
        .then((response) => {
          if (response.status === 200) {
            const ETag = response.headers.etag;
            if (ETag) {
              const uploadedPart = {
                PartNumber: partNumber,
                ETag: ETag.replace(/"/g, ""),
              };
              this.uploadedParts.push(uploadedPart);
              resolve(response.status);
            }
          } else {
            reject(new Error("Failed to upload part"));
          }
          delete this.activeConnections[partNumber - 1];
        })
        .catch((error) => {
          reject(error);
          delete this.activeConnections[partNumber - 1];
        });
    });
  }

  onProgress(onProgress: ProgressFunc) {
    this.onProgressFn = onProgress;
    return this;
  }

  onError(onError: VoidFunc) {
    this.onErrorFn = onError;
    return this;
  }

  onUploadFailed(onUploadFailed: VoidFunc) {
    this.onUploadFailedFn = onUploadFailed;
    return this;
  }

  uploadFailed(partNumber?: number) {
    if (partNumber) {
      const partBenchMark = this.benchmark?.getPartBenchMark(partNumber);
      partBenchMark?.complete({
        retryAttempts: this.partsRetryAttempts[partNumber] ?? 0,
        success: false,
        partNumber,
      });
    }
    this.benchmark?.complete({
      retryAttempts: this.fileUploadRetryAttempts,
      success: false,
      partNumber,
    });
  }

  completeUpload() {
    this.benchmark?.complete({
      retryAttempts: this.fileUploadRetryAttempts,
      success: true,
    });
    this.onCompleteFn(this.key, this.benchmark?.getBenchMark());
  }

  onComplete(onCompleteFn: UploaderCompleteFunc) {
    this.onCompleteFn = onCompleteFn;
    return this;
  }

  async abort() {
    try {
      Object.keys(this.activeConnections)
        .map(Number)
        .forEach((id) => {
          this.activeConnections[id].abort();
        });

      if (!this.uploadId || this.aborted) {
        return;
      }
      this.aborted = true;
      await this.apiClient.abortMultiPartUpload({
        key: this.key,
        uploadId: this.uploadId,
      });
    } catch (error) {
      this.onErrorFn(error);
    }
  }
}

export function measureConnectionSpeed(callback: (speed: number) => void) {
  const imageAddr =
    "https://upload.wikimedia.org/wikipedia/commons/3/3a/Bloemen_van_adderwortel_%28Persicaria_bistorta%2C_synoniem%2C_Polygonum_bistorta%29_06-06-2021._%28d.j.b%29.jpg";
  const downloadSize = 7300000; //bytes
  let startTime = 0;
  const download = new Image();
  download.onload = function () {
    const duration = (Date.now() - startTime) / 1000;
    const bitsLoaded = downloadSize * 8;
    const speedBps = bitsLoaded / duration;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;
    callback(speedMbps);
  };

  download.onerror = function (err, msg) {
    callback(-1);
  };

  startTime = Date.now();
  const cacheBuster = "?nnn=" + startTime;
  download.src = imageAddr + cacheBuster;
}

export class FileUploader {
  private files: FileInfo[];
  private uploaderOptions: Omit<UploaderOptions, "file" | "fileName">;
  private benchmark?: FileUploaderBenchmark;
  private fileBenchmarks: Record<string, TUploaderBenchmark>;
  private activeUploader: Record<string, Uploader>;
  private enableBenchmark: boolean;
  private toastId: string | null;
  private onCompleteFn: VoidFunction;
  private onProgressFn: FileUploaderProgressFunc;
  private onSingleFileUploadCompleteFn: SingleFileCompleteFunc;

  constructor(options: FileUploaderOptions) {
    const { files, ...uploaderOptions } = options;
    this.files = files;
    this.uploaderOptions = uploaderOptions;
    this.fileBenchmarks = {};
    this.activeUploader = {};
    this.enableBenchmark = options.enableBenchmark ?? false;
    this.onCompleteFn = () => {};
    this.onProgressFn = () => {};
    this.onSingleFileUploadCompleteFn = () => {};
    this.toastId = null;
  }

  start() {
    if (!this.enableBenchmark) {
      this.uploadNext();
      return;
    }
    this.toastId = toast.success(
      "File uploader initiating with benchmark profiling!",
      {
        duration: Infinity,
        icon: "🔥",
      },
    );
    const connectionSpeed = (navigator as any)?.connection?.downlink ?? 0;
    const uploadWithBenchmark = () => {
      this.benchmark = new FileUploaderBenchmark(fileUploaderBenchmarkOptions);
      this.uploadNext();
    };
    const fileUploaderBenchmarkOptions = {
      files: this.files,
      multiPartUploadOptions:
        this.uploaderOptions.multiPartUploadOptions ??
        Uploader.getDefaultMultiPartUploadOptions(),
      fileBenchmarks: this.fileBenchmarks,
      connectionSpeed: 0,
    };
    if (connectionSpeed) {
      fileUploaderBenchmarkOptions.connectionSpeed = connectionSpeed;
      uploadWithBenchmark();
      return;
    }
    const speedMeasureToast = toast.loading("Measuring your network speed!", {
      duration: 5000,
    });

    measureConnectionSpeed((speed) => {
      toast.dismiss(speedMeasureToast);
      fileUploaderBenchmarkOptions.connectionSpeed = speed;
      uploadWithBenchmark();
    });
  }

  onComplete(func: VoidFunction) {
    this.onCompleteFn = func;
    return this;
  }
  handleOnUploadFailed = (fileName: string) => () => {
    delete this.activeUploader[fileName];
    this.uploadNext();
  };

  onSingleFileUploadComplete(func: SingleFileCompleteFunc) {
    this.onSingleFileUploadCompleteFn = func;
    return this;
  }

  handleOnFileUploaded =
    (fileInfo: FileInfo) => (key: string, benchmark?: TUploaderBenchmark) => {
      if (benchmark) {
        this.fileBenchmarks[fileInfo.fileName] = benchmark;
      }
      delete this.activeUploader[fileInfo.fileName];
      this.uploadNext();
      this.onSingleFileUploadCompleteFn(key, fileInfo.fileObject);
    };
  onProgress(onProgress: FileUploaderProgressFunc) {
    this.onProgressFn = onProgress;
    return this;
  }
  handleOnProgress = (payload: {
    key: string;
    fileName: string;
    progress: UploadProgress;
  }) => {
    this.onProgressFn({
      id: payload.key,
      fileName: payload.fileName,
      uploadProgress: payload.progress,
    });
  };

  uploadComplete() {
    this.benchmark?.complete({
      retryAttempts: Object.values(this.fileBenchmarks).reduce(
        (acc, curr) => (acc += curr.retryAttempts),
        0,
      ),
    });
    if (this.toastId) {
      toast.dismiss(this.toastId);
    }
    this.onCompleteFn();
  }
  uploadNext() {
    if (!this.files.length) {
      if (this.files.length === Object.keys(this.activeUploader).length) {
        this.uploadComplete();
      }
      return;
    }
    const fileInfo = this.files.pop();
    if (!fileInfo) return;
    const fileName = fileInfo.fileName;
    const uploader = new Uploader({
      file: fileInfo.fileObject,
      fileName: fileInfo.fileName,
      ...this.uploaderOptions,
    })
      .onProgress(this.handleOnProgress)
      .onComplete(this.handleOnFileUploaded(fileInfo))
      .onUploadFailed(this.handleOnUploadFailed(fileName));

    this.activeUploader[fileName] = uploader;
    uploader.start();
    this.uploadNext();
  }
}

export class AxiosMultiPartApiClient extends UploadApiClient {
  private apiInstance = s3UploadAPIClient;
  private getSessionToken: () => Promise<string>;

  constructor(getSessionToken: () => Promise<string>) {
    super();
    this.getSessionToken = getSessionToken;
  }
  async getUploadPresignedUrl(
    getPreSignedUrlRequest: GetPreSignedUrlRequest,
  ): Promise<GetPreSignedUrlResponse> {
    const token = await this.getSessionToken();
    const response = await this.apiInstance(
      token,
    ).post<GetPreSignedUrlResponse>(`/`, {
      command: "getPreSignedUrl",
      payload: getPreSignedUrlRequest,
    });
    return response.data;
  }
  async createMultiPartUpload(
    createMultiPartUploadRequest: CreateMultipartUploadRequest,
  ): Promise<CreateMultiPartUploadResponse> {
    const token = await this.getSessionToken();

    const response = await this.apiInstance(
      token,
    ).post<CreateMultiPartUploadResponse>(`/`, {
      command: "createMultipartUpload",
      payload: createMultiPartUploadRequest,
    });
    return response.data;
  }
  async getUploadPartsPresignedUrls(
    getUploadPartsPresignedUrlsRequest: GetUploadPartsPresignedUrlsRequest,
  ): Promise<GetUploadPartPresignedUrlResponse[]> {
    const token = await this.getSessionToken();

    const response = await this.apiInstance(token).post<
      GetUploadPartPresignedUrlResponse[]
    >(`/`, {
      command: "getUploadPartPresignedUrls",
      payload: getUploadPartsPresignedUrlsRequest,
    });
    return response.data;
  }
  async completeMultipartUpload(
    completeMultipartUploadRequest: CompleteMultipartUploadRequest,
  ): Promise<void> {
    const token = await this.getSessionToken();

    const response = await this.apiInstance(token).post(`/`, {
      command: "completeMultipartUpload",
      payload: completeMultipartUploadRequest,
    });
    return response.data;
  }
  async abortMultiPartUpload(
    abortMultiPartUpload: AbortMultipartUploadRequest,
  ): Promise<void> {
    const token = await this.getSessionToken();
    const response = await this.apiInstance(token).post(`/`, {
      command: "abortMultiPartUpload",
      payload: abortMultiPartUpload,
    });
    return response.data;
  }
}

export const uploadMultiPartFile = (
  files: FileInfo[],
  onProgress: FileUploaderProgressFunc,
  onComplete: () => void,
  onSingleFileUploadComplete: SingleFileCompleteFunc,
  apiClient: AxiosMultiPartApiClient,
) => {
  new FileUploader({
    files,
    apiClient,
  })
    .onProgress(onProgress)
    .onComplete(onComplete)
    .onSingleFileUploadComplete(onSingleFileUploadComplete)
    .start();
};
