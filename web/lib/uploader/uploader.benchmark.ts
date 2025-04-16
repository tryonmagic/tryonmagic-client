import { FileInfo, MultiPartUploadOptions } from "./type";
import { FileType, FileTypes } from "./uploader";

abstract class Benchmark<T> {
  protected size: number;
  protected startTime: number;
  protected elapsedTime: number;
  protected retryAttempts: number;
  protected success: boolean;

  constructor(options: { size: number }) {
    this.size = options.size;
    this.elapsedTime = 0;
    this.retryAttempts = 0;
    this.startTime = Date.now();
    this.success = false;
  }

  calculateSpeed() {
    const speedInBytesPerSecond = this.size / (this.elapsedTime / 1000); // Bytes per second
    return speedInBytesPerSecond / 1024; // Convert to KB/s
  }

  protected setRetryCount(count: number) {
    this.retryAttempts = count;
  }

  uploadFailed(meta: { retryAttempts: number; partNumber?: number }) {
    this.setRetryCount(meta.retryAttempts);
    const elapsedTime = Date.now() - this.startTime;
    this.elapsedTime = elapsedTime;
    if (meta.partNumber) {
      return;
    }
  }

  abstract getBenchMark(): T;
}

type CBenchmark = {
  size: number;
  elapsedTime: number;
  avgUploadSpeed: number;
  retryAttempts: number;
};

export type TUploaderBenchmark = CBenchmark & {
  fileName: string;
  fileType: FileType;
  success: boolean;
  multiPartBenchMark?: Record<number, TUploaderBenchmark>;
  isMultiPart?: boolean;
  totalParts?: number;
};

export type TFileUploaderBenchmark = CBenchmark & {
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  fileUploadRate: number;
  imageUploadRate: number;
  videoUploadRate: number;
  fileBenchmarks?: Record<string, TUploaderBenchmark>;
  filesRetried: number;
  fileSuccessfullyUploaded: number;
  multiPartUploadOptions: MultiPartUploadOptions;
  totalRetryAttempts: number;
  connectionSpeed: number;
};

type FileTypeContent = {
  total: number;
  [FileTypes.image]: number;
  [FileTypes.video]: number;
  [FileTypes.other]: number;
};

export class UploaderBenchmark extends Benchmark<TUploaderBenchmark> {
  private fileName: string;
  private isMultiPart: boolean;
  private totalParts?: number;
  private isPart: boolean;
  private multiPartBenchMark?: Record<number, UploaderBenchmark>;
  protected fileType: FileType;

  constructor(options: {
    fileName: string;
    size: number;
    isMultiPart: boolean;
    totalParts?: number;
    isPart?: boolean;
    fileType: FileType;
  }) {
    super({ size: options.size });
    this.fileName = options.fileName;
    this.fileType = options.fileType;

    this.isMultiPart = options.isMultiPart;
    this.isPart = options.isPart ?? false;
    this.totalParts = options.totalParts;
    this.multiPartBenchMark = {};
  }
  get getElapsedTime() {
    return this.elapsedTime;
  }
  complete(meta: {
    retryAttempts: number;
    partNumber?: number;
    success: boolean;
  }) {
    this.setRetryCount(meta.retryAttempts);
    const elapsedTime = Date.now() - this.startTime;
    this.elapsedTime = elapsedTime;
    if (meta.partNumber) {
      // console.log(`Elapsed Time of ${meta.partNumber}: ${elapsedTime} ms`);
      return;
    }
    // console.log(`Elapsed Time: ${elapsedTime} ms`);
  }
  getBenchMark() {
    const multiPartBenchMark: Record<number, TUploaderBenchmark> = {};
    Object.keys(this.multiPartBenchMark!).forEach((key) => {
      multiPartBenchMark[Number(key)] =
        this.multiPartBenchMark![Number(key)].getBenchMark();
    });

    const benchmark: TUploaderBenchmark = {
      fileName: this.fileName,
      fileType: this.fileType,
      size: this.size,
      elapsedTime: this.elapsedTime,
      avgUploadSpeed: this.calculateSpeed(),
      retryAttempts: this.retryAttempts,
      success: this.success,
    };

    if (!this.isPart && this.isMultiPart) {
      benchmark.multiPartBenchMark = multiPartBenchMark;
      benchmark.totalParts = this.totalParts;
      benchmark.isMultiPart = this.isMultiPart;
    }

    return benchmark;
  }

  addPartBenchmark(partNumber: number, partSize: number) {
    const benchmark = new UploaderBenchmark({
      fileName: this.fileName,
      fileType: this.fileType,
      isMultiPart: true,
      size: partSize,
      isPart: true,
    });
    this.multiPartBenchMark![partNumber] = benchmark;
    return benchmark;
  }

  getPartBenchMark(partNumber: number) {
    if (!this.multiPartBenchMark) return null;
    return this.multiPartBenchMark[partNumber] ?? null;
  }
}

export class FileUploaderBenchmark extends Benchmark<TFileUploaderBenchmark> {
  private fileTypeContent: FileTypeContent;
  private multiPartUploadOptions: MultiPartUploadOptions;
  private fileBenchmarks: Record<string, TUploaderBenchmark>;
  private connectionSpeed: number;

  constructor(options: {
    files: FileInfo[];
    multiPartUploadOptions: MultiPartUploadOptions;
    fileBenchmarks: Record<string, TUploaderBenchmark>;
    connectionSpeed: number;
  }) {
    const fileSize = options.files.reduce(
      (acc, file) => (acc += file.fileObject.size),
      0,
    );
    super({ size: fileSize });
    this.categorizeFiles(options.files);
    this.multiPartUploadOptions = options.multiPartUploadOptions;
    this.fileBenchmarks = options.fileBenchmarks;
    this.connectionSpeed = options.connectionSpeed;
    this.fileTypeContent = {
      [FileTypes.image]: 0,
      [FileTypes.video]: 0,
      [FileTypes.other]: 0,
      total: options.files.length,
    };
  }

  complete(meta: { retryAttempts: number }) {
    this.setRetryCount(meta.retryAttempts);
    const elapsedTime = Date.now() - this.startTime;
    this.elapsedTime = elapsedTime;
    console.log(`[FileUploader] : Total Elapsed Time: ${elapsedTime} ms`);
    console.log(this.getBenchMark());
  }

  categorizeFiles(files: FileInfo[]) {
    const fileTypeCount = {
      [FileTypes.image]: 0,
      [FileTypes.video]: 0,
      [FileTypes.other]: 0,
      total: files.length,
    };

    files.forEach((file) => {
      const fileType = file.fileObject.type.split("/")[0];
      switch (fileType) {
        case FileTypes.image:
          fileTypeCount[FileTypes.image]++;
          break;
        case FileTypes.video:
          fileTypeCount[FileTypes.video]++;
          break;
        default:
          fileTypeCount[FileTypes.other]++;
          break;
      }
    });
    this.fileTypeContent = fileTypeCount;
  }

  /*
   *return speed file/minutes
   */
  calculateUploadRateByFileType(fileType: FileType | "total") {
    const elapsedTime =
      fileType === "total"
        ? this.elapsedTime
        : Object.values(this.fileBenchmarks ?? {})
            .filter((b) => b.fileType === fileType)
            .reduce((acc, b) => acc + b.elapsedTime, 0);
    if (!elapsedTime) return 0;
    return this.fileTypeContent[fileType] / (elapsedTime / (60 * 1000));
  }

  getImageUploadRate() {
    return this.calculateUploadRateByFileType(FileTypes.image);
  }

  getVideoUploadRate() {
    return this.calculateUploadRateByFileType(FileTypes.video);
  }

  getFileUploadRate() {
    return this.calculateUploadRateByFileType("total");
  }

  getBenchMark() {
    const benchmark: TFileUploaderBenchmark = {
      size: this.size,
      elapsedTime: this.elapsedTime,
      avgUploadSpeed: this.calculateSpeed(),
      retryAttempts: this.retryAttempts,
      totalFiles: this.fileTypeContent.total,
      fileUploadRate: this.getFileUploadRate(),
      totalImages: this.fileTypeContent[FileTypes.image],
      imageUploadRate: this.getImageUploadRate(),
      totalVideos: this.fileTypeContent[FileTypes.video],
      videoUploadRate: this.getVideoUploadRate(),
      filesRetried: Object.values(this.fileBenchmarks).filter(
        (b) => b.retryAttempts,
      ).length,
      fileSuccessfullyUploaded: Object.values(this.fileBenchmarks).filter(
        (b) => b.success,
      ).length,
      multiPartUploadOptions: this.multiPartUploadOptions,
      totalRetryAttempts: Object.values(this.fileBenchmarks).reduce(
        (acc, b) => acc + b.retryAttempts,
        0,
      ),
      fileBenchmarks: this.fileBenchmarks,
      connectionSpeed: this.connectionSpeed,
    };

    return benchmark;
  }
}
