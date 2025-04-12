"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import {
  Dialog as CDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

// Types
type ImageType = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  type: string;
  tags: string[];
  uploadDate: Date;
  selected?: boolean;
  uploading?: boolean;
  progress?: number;
};

type ViewMode = "grid" | "list";
type SortOption =
  | "newest"
  | "oldest"
  | "nameAsc"
  | "nameDesc"
  | "sizeAsc"
  | "sizeDesc";

// Mock data for initial gallery
const mockImages: ImageType[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `img-${i + 1}`,
  name: `Sample Image ${i + 1}.jpg`,
  url: `https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=500&width=400`,
  thumbnailUrl: `https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=500&width=400`,
  size: Math.floor(Math.random() * 5000000) + 500000,
  type: ["jpg", "png", "gif"][Math.floor(Math.random() * 3)],
  tags: [
    "sample",
    i % 2 === 0 ? "landscape" : "portrait",
    i % 3 === 0 ? "color" : "bw",
  ],
  uploadDate: new Date(
    Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
  ),
}));

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

interface ImageUploadDialogProps {
  triggerButtonText?: string;
  onImagesSelected?: (selectedImages: ImageType[]) => void;
}

export default function ImageUploadDialog({
  triggerButtonText = "Open Image Manager",
  onImagesSelected,
}: ImageUploadDialogProps) {
  const [open, setOpen] = useState(true);

  // Function to handle image insertion and close dialog
  const handleInsertImages = (
    selectedImageIds: string[],
    images: ImageType[],
  ) => {
    if (onImagesSelected) {
      const selectedImages = images.filter((img) =>
        selectedImageIds.includes(img.id),
      );
      onImagesSelected(selectedImages);
    }
    setOpen(false);
  };

  return (
    <CDialog open={open} onClose={setOpen} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto  mt-16">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            style={{ width: "90vw" }}
          >
            <ImageUploadManager
              onInsert={handleInsertImages}
              onClose={() => setOpen(false)}
            />
          </DialogPanel>
        </div>
      </div>
    </CDialog>
  );
}

function ImageUploadManager({
  onInsert,
  onClose,
}: {
  onInsert: (selectedImageIds: string[], images: ImageType[]) => void;
  onClose: () => void;
}) {
  // State
  const [images, setImages] = useState<ImageType[]>(mockImages);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    fileType: [] as string[],
    dateRange: null as { from: Date; to: Date } | null,
  });
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploadingCount((prev) => prev + files.length);

      Array.from(files).forEach((file) => {
        const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const objectUrl = URL.createObjectURL(file);

        // Immediately add to gallery with uploading status
        const newImage: ImageType = {
          id: imageId,
          name: file.name,
          url: objectUrl,
          thumbnailUrl: objectUrl,
          size: file.size,
          type: file.name.split(".").pop() || "",
          tags: ["new"],
          uploadDate: new Date(),
          uploading: true,
          progress: 0,
        };

        setImages((prev) => [newImage, ...prev]);

        // Simulate upload progress
        const simulateUpload = () => {
          setImages((prev) =>
            prev.map((img) => {
              if (
                img.id === imageId &&
                img.uploading &&
                (img.progress || 0) < 100
              ) {
                const newProgress = Math.min(
                  (img.progress || 0) + Math.random() * 20,
                  100,
                );
                return { ...img, progress: newProgress };
              }
              return img;
            }),
          );

          const currentImage = images.find((img) => img.id === imageId);
          if (currentImage?.uploading && (currentImage.progress || 0) < 100) {
            setTimeout(simulateUpload, 500);
          } else if (currentImage?.uploading) {
            // When upload is complete, update the image
            setTimeout(() => {
              setImages((prev) =>
                prev.map((img) => {
                  if (img.id === imageId) {
                    return { ...img, uploading: false };
                  }
                  return img;
                }),
              );
              setUploadingCount((prev) => prev - 1);
            }, 500);
          }
        };

        setTimeout(simulateUpload, 300);
      });
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
  const toggleImageSelection = useCallback((id: string) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((imgId) => imgId !== id) : [...prev, id],
    );
  }, []);

  // Handle image deletion
  const handleDeleteSelected = useCallback(() => {
    setImages((prev) => prev.filter((img) => !selectedImages.includes(img.id)));
    setSelectedImages([]);
  }, [selectedImages]);

  // Filter and sort images
  const filteredAndSortedImages = images
    .filter((img) => {
      // Always show uploading images regardless of filters
      if (img.uploading) return true;

      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      // File type filter
      const matchesFileType =
        filters.fileType.length === 0 || filters.fileType.includes(img.type);

      // Date range filter
      const matchesDateRange =
        !filters.dateRange ||
        (img.uploadDate >= filters.dateRange.from &&
          img.uploadDate <= filters.dateRange.to);

      return matchesSearch && matchesFileType && matchesDateRange;
    })
    .sort((a, b) => {
      // Always show uploading images at the top
      if (a.uploading && !b.uploading) return -1;
      if (!a.uploading && b.uploading) return 1;

      switch (sortOption) {
        case "newest":
          return b.uploadDate.getTime() - a.uploadDate.getTime();
        case "oldest":
          return a.uploadDate.getTime() - b.uploadDate.getTime();
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "sizeAsc":
          return a.size - b.size;
        case "sizeDesc":
          return b.size - a.size;
        default:
          return 0;
      }
    });

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Image Upload Manager</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
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
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-medium">
                Drag and drop your images here
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">or</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Browse Files
            </button>
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, GIF (max 10MB)
            </p>
          </motion.div>
        </div>

        {/* Gallery Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 ml-2" />
            <input
              type="text"
              placeholder="Search images by name or tags..."
              className="w-full pr-4 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-between">
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

            {/* View Toggle */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-2 flex items-center",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-gray-50",
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 py-2 flex items-center",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-gray-50",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="min-h-[200px]">
          {filteredAndSortedImages.length === 0 ? (
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
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {filteredAndSortedImages.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "relative group rounded-md overflow-hidden border",
                      selectedImages.includes(img.id) && "ring-2 ring-primary",
                    )}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={img.thumbnailUrl || "/placeholder.svg"}
                        alt={img.name}
                        width={300}
                        height={300}
                        className={cn(
                          "w-full h-full object-cover",
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
                              selectedImages.includes(img.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-white/20 text-white hover:bg-white/30",
                            )}
                          >
                            {selectedImages.includes(img.id) ? (
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
                              selectedImages.includes(img.id)
                                ? "opacity-100 bg-primary border-primary text-primary-foreground"
                                : "opacity-0 group-hover:opacity-100 bg-black/50 border-white/50 text-white",
                            )}
                          >
                            {selectedImages.includes(img.id) && (
                              <Check className="w-4 h-4" />
                            )}
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
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-6 md:col-span-5">Name</div>
                <div className="col-span-3 md:col-span-2">Type</div>
                <div className="hidden md:block md:col-span-2">Size</div>
                <div className="col-span-3 md:col-span-3">Date</div>
              </div>
              <AnimatePresence>
                {filteredAndSortedImages.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-3 rounded-md items-center hover:bg-gray-50 transition-colors",
                      selectedImages.includes(img.id) && "bg-primary/5",
                      img.uploading ? "cursor-default" : "cursor-pointer",
                    )}
                    onClick={() =>
                      !img.uploading && toggleImageSelection(img.id)
                    }
                  >
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                      {!img.uploading && (
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                            selectedImages.includes(img.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-gray-300",
                          )}
                        >
                          {selectedImages.includes(img.id) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      )}

                      {img.uploading && (
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {Math.round(img.progress || 0)}%
                          </span>
                        </div>
                      )}

                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={img.thumbnailUrl || "/placeholder.svg"}
                          alt={img.name}
                          width={300}
                          height={300}
                          className={cn(
                            "w-full h-full object-cover",
                            img.uploading && "opacity-70",
                          )}
                        />

                        {img.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-1 bg-white/30 absolute bottom-0">
                              <motion.div
                                className="h-full bg-white"
                                initial={{ width: 0 }}
                                animate={{ width: `${img.progress || 0}%` }}
                                transition={{ ease: "easeInOut" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="truncate" title={img.name}>
                        {img.name}
                      </span>
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        .{img.type}
                      </span>
                    </div>
                    <div className="hidden md:block md:col-span-2 text-sm text-muted-foreground">
                      {formatFileSize(img.size)}
                    </div>
                    <div className="col-span-3 md:col-span-3 text-sm text-muted-foreground flex items-center gap-1">
                      {img.uploading ? (
                        <span className="text-primary">Uploading...</span>
                      ) : (
                        <>
                          <Calendar className="w-3 h-3" />
                          {formatDate(img.uploadDate)}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="border-t p-4 flex items-center justify-between bg-gray-50">
        <div>
          {selectedImages.length > 0 && (
            <span className="text-sm">
              {selectedImages.length}{" "}
              {selectedImages.length === 1 ? "image" : "images"} selected
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selectedImages.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImages([])}
              >
                Deselect All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onInsert(selectedImages, images)}
            disabled={selectedImages.length === 0}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Insert{" "}
            {selectedImages.length > 0 ? `(${selectedImages.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
