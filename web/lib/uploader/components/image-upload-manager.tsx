"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Upload,
  Grid,
  List,
  Filter,
  ChevronDown,
  Check,
  Calendar,
  FileType,
  Trash2,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import debounce, { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import {
  Dialog as CDialog,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import {
  FileInfo,
  FileUploadingModalMeta,
  IFile,
  UploadingProgressMeta,
} from "../type";
import toast from "react-hot-toast";
import {
  AxiosMultiPartApiClient,
  uploadMultiPartFile,
  UploadProgress,
} from "../uploader";
import { generateThumbHash } from "../utils";
import { clientAPI, s3UploadAPIClient } from "@/lib/api";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useAuthenticatedQuery } from "@/lib/hooks/useAuthenticatedQuery";
import { getFilesQuery } from "./queries";
import Pagination from "@/components/ui/pagination";

export type ImageType = {
  id: string;
  name: string;
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  size: number;
  type: string;
  tags: string[];
  uploadDate: Date;
  selected?: boolean;
  uploading?: boolean;
  progress?: number;
  new?: boolean;
};

export enum SortOption {
  NEWEST = "newest",
  OLDEST = "oldest",
  NAME_ASC = "nameAsc",
  NAME_DESC = "nameDesc",
  SIZE_ASC = "sizeAsc",
  SIZE_DESC = "sizeDesc",
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const getPreviewFilesWithCount = (
  files: FileInfo[] | null,
): FileUploadingModalMeta | null => {
  if (!files) {
    return null;
  }
  const images: File[] = [];
  const videos: File[] = [];
  const MAX_IMAGES = 2;
  const MAX_VIDEOS = 2;
  const PREVIEW_MAX = 4;
  const totalFiles = files.length;
  for (let i = 0; i < totalFiles; i++) {
    const fileInfo = files[i];
    if (fileInfo.fileObject.type.startsWith("image")) {
      images.push(fileInfo.fileObject);
    } else if (fileInfo.fileObject.type.startsWith("video")) {
      videos.push(fileInfo.fileObject);
    } else {
      throw new Error(
        `Only image and video file are acceptable. Got ${fileInfo.fileObject.type}! `,
      );
    }
  }

  const previewFiles: File[] = images
    .slice(0, MAX_IMAGES)
    .concat(...videos.slice(0, MAX_VIDEOS));

  if (previewFiles.length < PREVIEW_MAX && images.length > MAX_IMAGES) {
    previewFiles.push(
      ...images.slice(2, 2 + (PREVIEW_MAX - previewFiles.length)),
    );
  } else if (previewFiles.length < PREVIEW_MAX && videos.length > MAX_VIDEOS) {
    previewFiles.push(
      ...videos.slice(2, 2 + (PREVIEW_MAX - previewFiles.length)),
    );
  }

  return {
    previewFiles,
    totalVideos: videos.length,
    totalImages: images.length,
    totalFiles,
    uploadedFile: new Set(),
  };
};
interface ImageUploadDialogProps {
  onImagesSelected?: (selectedImages: ImageType[]) => void;
  imageSelectionLimit?: number;
  onClose?: () => void;
  hideCancelButton?: boolean;
  hideUploadButton?: boolean;
  hideActions?: boolean;
}

export default function ImageUploadDialog({
  onImagesSelected,
  imageSelectionLimit,
  onClose,
  hideCancelButton,
  hideUploadButton,
  hideActions,
}: ImageUploadDialogProps) {
  // Function to handle image insertion and close dialog
  const handleInsertImages = (images: ImageType[]) => {
    if (onImagesSelected) {
      onImagesSelected(images);
    }
    onClose?.();
  };

  return (
    <CDialog open onClose={() => onClose?.()} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto ">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            style={{ width: "90vw" }}
          >
            <ImageGallery
              onInsert={handleInsertImages}
              onClose={() => onClose?.()}
              imageSelectionLimit={imageSelectionLimit}
              hideCancelButton={hideCancelButton}
              hideUploadButton={hideUploadButton}
              hideActions={hideActions}
            />
          </DialogPanel>
        </div>
      </div>
    </CDialog>
  );
}

const PAGE_SIZE = 10;
export function ImageGallery({
  onInsert,
  onClose,
  imageSelectionLimit,
  hideCancelButton,
  hideActions,
  onSelected,
  hideUploadButton,
}: {
  onInsert?: (images: ImageType[]) => void;
  onClose?: () => void;
  imageSelectionLimit?: number;
  hideCancelButton?: boolean;
  hideActions?: boolean;
  onSelected?: (selectedImages: ImageType[]) => void;
  hideUploadButton?: boolean;
}) {
  const [selectedImages, setSelectedImages] = useState<ImageType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState({
    fileType: [] as string[],
    dateRange: null as { from: Date; to: Date } | null,
  });
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.NEWEST);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [fileUploadingModalMeta, setFileUploadingModalMeta] =
    useState<FileUploadingModalMeta | null>(null);
  const [uploadingProgressMeta, setUploadingProgressMeta] = useState<
    Record<string, UploadingProgressMeta>
  >({});
  const [uploadedImages, setUploadedImages] = useState<ImageType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const app = useAppBridge();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    data: images,
    isFetching,
    refetch,
  } = useAuthenticatedQuery({
    queryKey: [
      "files",
      {
        page: currentPage,
        pageSize: PAGE_SIZE,
        types: filters.fileType,
        search: searchQuery,
        sortOption,
      },
    ],
    queryFn: getFilesQuery,
  });

  const allImages = useMemo(() => {
    return [...uploadedImages, ...(images?.results ?? [])];
  }, [uploadedImages, images]);

  const handleOnProgress = ({
    id,
    fileName,
    uploadProgress,
  }: {
    id: string;
    fileName: string;
    uploadProgress: UploadProgress;
  }) => {
    setUploadingProgressMeta((prevState) => ({
      ...prevState,
      [id]: {
        id,
        progress: uploadProgress.percentage,
      },
    }));
    setUploadedImages((prev) =>
      prev.map((img) => {
        if ([id, fileName].includes(img.id) && img.uploading) {
          return {
            ...img,
            progress: uploadProgress.percentage,
            uploading: uploadProgress.percentage !== 100,
          };
        }
        return img;
      }),
    );
  };

  const handleOnComplete = () => {
    setFileUploadingModalMeta((prevState) => ({
      ...(prevState as FileUploadingModalMeta),
      completed: true,
    }));
    setUploadingProgressMeta({});
    setCurrentPage(1);
    refetch();
    setUploadedImages([]);
  };

  const saveFile = async (key: string, file: File) => {
    const token = await app.idToken();

    const saveFileRequest: IFile = {
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
    if (file.type.startsWith("image")) {
      const imageInfo = await generateThumbHash(file);
      // saveFileRequest.thumbHash = imageInfo.thumbHash;
      saveFileRequest.width = imageInfo.width;
      saveFileRequest.height = imageInfo.height;
    }
    const response = await clientAPI(token).post<IFile>(
      `/storage/save-file`,
      saveFileRequest,
    );
    return response.data;
  };

  const handleOnSingleUploadFileComplete = async (key: string, file: File) => {
    await saveFile(key, file);
    setFileUploadingModalMeta((prevState) => {
      const uploadedFile = prevState?.uploadedFile ?? new Set();
      uploadedFile.add(key);
      return {
        ...(prevState as FileUploadingModalMeta),
        uploadedFile,
      };
    });
  };

  const uploadMediaToS3 = async (files: FileInfo[]) => {
    const getSessionToken = async () => {
      const token = await app.idToken();
      return token;
    };
    uploadMultiPartFile(
      files,
      handleOnProgress,
      handleOnComplete,
      handleOnSingleUploadFileComplete,
      new AxiosMultiPartApiClient(getSessionToken),
    );
  };

  const handleOnFileUpload = (files: FileInfo[]) => {
    try {
      setFileUploadingModalMeta(getPreviewFilesWithCount(files));
      uploadMediaToS3(files);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message ?? "Something went wrong!");
    }
  };
  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        toast.success("No file selected!");
        return;
      }

      const fileInfos: FileInfo[] = [];

      Array.from(files).forEach((file) => {
        const objectUrl = URL.createObjectURL(file);

        const fileName =
          file.name.split(".")[0] +
          `-${Date.now()}` +
          "." +
          file.name.split(".").pop();
        // Immediately add to gallery with uploading status
        const newImage: ImageType = {
          id: file.name,
          name: fileName,
          url: objectUrl,
          originalUrl: objectUrl,
          thumbnailUrl: objectUrl,
          size: file.size,
          type: file.name.split(".").pop() || "",
          tags: ["new"],
          uploadDate: new Date(),
          uploading: true,
          progress: 0,
          new: true,
        };
        fileInfos.push({
          fileName,
          fileObject: file,
        });

        setUploadedImages((prev) => [newImage, ...prev]);
      });
      setUploadingCount((prev) => prev + files.length);
      handleOnFileUpload(fileInfos);
    },
    [images],
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  // Handle image selection
  const toggleImageSelection = useCallback(
    (id: string) => {
      console.log("imageSelectionLimit", imageSelectionLimit);
      if (imageSelectionLimit === 1) {
        // Only one image can be selected at a time
        setSelectedImages((prev) => {
          const alreadySelected = prev.length > 0 && prev[0]?.id === id;
          if (alreadySelected) {
            // Deselect if already selected
            if (onSelected) {
              onSelected([]);
            }
            return [];
          } else {
            // Select only the new image
            const newImage = allImages.find((img) => img?.id === id);
            const res = newImage ? [newImage] : [];
            if (onSelected) {
              onSelected(res);
            }
            return res;
          }
        });

        return;
      }

      if (
        imageSelectionLimit &&
        !selectedImages.find((img) => img?.id === id) &&
        selectedImages.length >= imageSelectionLimit
      ) {
        toast.error(`You can only select up to ${imageSelectionLimit} images.`);
        return;
      }

      setSelectedImages((prev) => {
        const existingImage = prev.find((img) => img?.id === id);
        if (existingImage) {
          return prev.filter((img) => img?.id !== id);
        } else {
          const newImage = allImages.find((img) => img?.id === id);
          return newImage ? [...prev, newImage] : prev;
        }
      });
    },
    [selectedImages, imageSelectionLimit, allImages],
  );

  // Handle image deletion
  const handleDeleteSelected = useCallback(() => {
    setUploadedImages((prev) =>
      prev.filter((img) => !selectedImages.find((sImg) => sImg?.id === img.id)),
    );
    setSelectedImages([]);
  }, [selectedImages]);

  const handleSearchWithDebounce = useMemo(
    () =>
      debounce((value: string) => {
        console.log("value", value);
        setSearchQuery(value);
        setCurrentPage(1);
      }, 300),
    [],
  );
  return (
    <div className="flex flex-col h-[80vh] bg-white p-2">
      {/* Header */}
      <div className="flex items-center justify-between p-1">
        {!hideCancelButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Upload Area */}
        {!hideUploadButton && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-2 text-center transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary/50",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
              id="file-upload"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              {/* <div>
              <h3 className="text-base font-medium">
                Drag and drop your images here
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">or</p>
            </div> */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Browse Files
              </button>
              <p className="text-xs text-muted-foreground">
                Supports: JPG, JPEG, PNG, WEBP (max 10MB)
              </p>
            </motion.div>
          </div>
        )}

        {/* Gallery Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 ml-2" />
            <input
              type="text"
              placeholder="Search images by name or type"
              className="w-full pr-4 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              onChange={(e) => handleSearchWithDebounce(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-between mb-2">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-3 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 w-64 bg-background border rounded-md shadow-lg z-10"
                  >
                    <div className="p-3 border-b">
                      <h4 className="font-medium">File Type</h4>
                      <div className="mt-2 space-y-2">
                        {["jpg", "png", "gif"].map((type) => (
                          <label
                            key={type}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filters.fileType.includes(type)}
                              onChange={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  fileType: prev.fileType.includes(type)
                                    ? prev.fileType.filter((t) => t !== type)
                                    : [...prev.fileType, type],
                                }));
                              }}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span className="text-sm">.{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-3">
                      <h4 className="font-medium">Sort By</h4>
                      <select
                        className="mt-2 w-full p-2 border rounded-md text-sm"
                        value={sortOption}
                        onChange={(e) =>
                          setSortOption(e.target.value as SortOption)
                        }
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="nameAsc">Name (A-Z)</option>
                        <option value="nameDesc">Name (Z-A)</option>
                        <option value="sizeAsc">Size (Smallest)</option>
                        <option value="sizeDesc">Size (Largest)</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!hideActions && (
              <div className="flex items-center justify-between bg-gray-50">
                {selectedImages.length > 1 && (
                  <div className="mr-2">
                    {selectedImages.length > 0 && (
                      <span className="text-sm">
                        {selectedImages.length}{" "}
                        {selectedImages.length === 1 ? "image" : "images"}{" "}
                        selected
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  {selectedImages.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedImages([])}
                      >
                        Deselect {imageSelectionLimit === 1 ? "image" : "All"}
                      </Button>
                      {/* <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button> */}
                    </>
                  )}
                  {!hideCancelButton && (
                    <Button variant="outline" size="sm" onClick={onClose}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onInsert?.(selectedImages)}
                    disabled={selectedImages.length === 0}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Insert{" "}
                    {imageSelectionLimit !== 1 && selectedImages.length > 0
                      ? `(${selectedImages.length})`
                      : ""}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="min-h-[200px]">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : allImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileType className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No images found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery || filters.fileType.length > 0
                  ? "Try adjusting your search or filters"
                  : "Upload some images to get started"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {allImages.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "relative group rounded-md overflow-hidden border",
                      selectedImages.find((sImg) => sImg?.id === img.id) &&
                        "ring-2 ring-primary",
                    )}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={img.thumbnailUrl || "/placeholder.svg"}
                        alt={img.name}
                        fill
                        className={cn(
                          "object-contain",
                          img.uploading && "opacity-70",
                        )}
                      />

                      {/* Upload Progress Overlay */}
                      {img.uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
                            <span className="text-white font-medium">
                              {Math.round(img.progress || 0)}%
                            </span>
                          </div>
                          <div className="w-3/4 h-2 bg-white/30 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-white"
                              initial={{ width: 0 }}
                              animate={{ width: `${img.progress || 0}%` }}
                              transition={{ ease: "easeInOut" }}
                            />
                          </div>
                        </div>
                      )}

                      {!img.uploading && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => toggleImageSelection(img.id)}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                              selectedImages.find((sImg) => sImg?.id === img.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-white/20 text-white hover:bg-white/30",
                            )}
                          >
                            {selectedImages.find(
                              (sImg) => sImg?.id === img.id,
                            ) ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      )}

                      {!img.uploading && (
                        <div className="absolute top-2 right-2">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-opacity",
                              selectedImages.find((sImg) => sImg?.id === img.id)
                                ? "opacity-100 bg-primary border-primary text-primary-foreground"
                                : "opacity-0 group-hover:opacity-100 bg-black/50 border-white/50 text-white",
                            )}
                          >
                            {selectedImages.find(
                              (sImg) => sImg?.id === img.id,
                            ) && <Check className="w-4 h-4" />}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p
                        className="text-sm font-medium truncate"
                        title={img.name}
                      >
                        {img.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(img.size)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={images?.totalPages ?? 0}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
