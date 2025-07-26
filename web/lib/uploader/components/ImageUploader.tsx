import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { IFile } from "../type";
import { generateThumbHash } from "../utils";
import { useAppBridge } from "@shopify/app-bridge-react";
import { AxiosMultiPartApiClient, Uploader, UploadProgress } from "../uploader";
import toast from "react-hot-toast";
import { saveFileRequest } from "@/lib/api/storage";
import Image from "next/image";

export interface ImageInfo {
  uploadLocation: string;
  width: number;
  height: number;
  fileName: string;
  previewImageUrl: string;
}
interface ImageUploaderProps {
  placeholder?: string;
  hideImagePreviewAfterUpload?: boolean;
  onUploaded: (imageInfo: ImageInfo) => void;
}

export default function ImageUploader(props: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingProgress, setUploadingProgress] =
    useState<UploadProgress | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false); // NEW
  const app = useAppBridge();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const previewImageResult = reader.result as string;
        setPreviewImage(previewImageResult); // Update state for UI
        setIsUploading(true);
        try {
          uploadMediaToS3(file, previewImageResult); // Pass previewImageResult
        } catch (error) {
          const err = error as Error;
          toast.error(err.message ?? "Something went wrong!");
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select a file to upload.");
    }
  };

  const uploadMediaToS3 = async (file: File, previewImageResult: string) => {
    const fileName =
      file.name.split(".")[0] +
      `-${Date.now()}` +
      "." +
      file.name.split(".").pop();
    const uploader = new Uploader({
      file,
      fileName,
      apiClient: new AxiosMultiPartApiClient(getSessionToken),
    })
      .onProgress(handleOnProgress)
      .onComplete(handleOnFileUploaded(file, previewImageResult)) // Pass previewImageResult
      .onUploadFailed(() => {
        setIsUploading(false);
      });
    uploader.start();
  };

  const handleOnFileUploaded =
    (file: File, previewImageResult: string) => async (key: string) => {
      await saveFile(key, file, previewImageResult); // Pass previewImageResult
      setIsUploading(false);
      if (props.hideImagePreviewAfterUpload) {
        setPreviewImage(null);
      }
    };

  const saveFile = async (
    key: string,
    file: File,
    previewImageResult: string,
  ) => {
    const token = await app.idToken();

    const payload: IFile = {
      key: key,
      name: file.name,
      type: file.type,
      size: file.size,
      ext: file.name.split(".").pop() as string,
      mime: file.type,
      fullPath: `tryonmagic/${key}`,
      url: "s3://tryonmagic/" + key,
      width: 0,
      height: 0,
    };
    const imageInfo = await generateThumbHash(file);
    payload.width = imageInfo.width;
    payload.height = imageInfo.height;
    const response = await saveFileRequest(token, payload);
    const fileInfo = response.data.data;
    if (!fileInfo) {
      toast.error("Failed to save file information.");
      return;
    }
    props.onUploaded({
      uploadLocation: fileInfo.url,
      width: imageInfo.width,
      height: imageInfo.height,
      fileName: fileInfo.name,
      previewImageUrl: previewImageResult, // Use the passed previewImageResult
    });
    return response.data;
  };
  const handleOnProgress = (payload: {
    key: string;
    fileName: string;
    progress: UploadProgress;
  }) => {
    setUploadingProgress(payload.progress);
  };

  const getSessionToken = async () => {
    const token = await app.idToken();
    return token;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  // Extracted file handler for both input and drop
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const previewImageResult = reader.result as string;
      setPreviewImage(previewImageResult);
      setIsUploading(true);
      try {
        uploadMediaToS3(file, previewImageResult);
      } catch (error) {
        const err = error as Error;
        toast.error(err.message ?? "Something went wrong!");
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="p-6">
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading} // Disable input when uploading
          style={{ cursor: isUploading ? "not-allowed" : "pointer" }} // Change cursor to indicate disabled state
        />
        {previewImage ? (
          <div
            className="flex flex-col items-center justify-center space-y-3"
            style={{ cursor: isUploading ? "not-allowed" : "pointer" }} // Change cursor to indicate disabled state
          >
            <Image
              src={previewImage}
              alt="Preview"
              height={500}
              width={500}
              className="w-full h-auto rounded-md"
            />
            {isUploading && (
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Uploading...
              </p>
            )}
            {isUploading && (
              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-500 ease-in-out"
                  style={{ width: `${uploadingProgress?.percentage || 0}%` }}
                ></div>
              </div>
            )}
            {!isUploading && (
              <button
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Another Picture
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
              <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {props.placeholder ?? "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG or WEBP (max. 10MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
