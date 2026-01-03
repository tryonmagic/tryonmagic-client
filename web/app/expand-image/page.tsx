"use client";

import type React from "react";

import { useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Maximize,
  Loader2,
  Download,
  Trash2,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeftIcon,
  ArrowRight,
  MoveHorizontal,
  MoveVertical,
  RefreshCw,
  Layers,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, handleDownload } from "@/lib/utils";
import { ShopifyImageActions } from "@/components/shopify/ShopifyImageActions";
import ImageUploader, {
  ImageInfo,
} from "@/lib/uploader/components/ImageUploader";
import Image from "next/image";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  EnhanceImageTaskInput,
  ImageSourceType,
  NewTask,
  TaskProgress,
  TaskStatus,
  TaskType,
  getPointsForTaskType,
} from "@/lib/api/type";
import { newTask } from "@/lib/api/tasks";
import { WebSocketClient } from "@/socket";
import { AxiosError } from "axios";
import EnhancedImage from "@/components/ui/EnhanchedImage";
import {
  ImageGallery,
  ImageType,
} from "@/lib/uploader/components/image-upload-manager";
import ShopifyFileBrowser from "@/components/shopify/ShopifyFileBrowser";

interface ExampleCardProps {
  title: string;
  description: string;
  before: string;
  after: string;
}

function ExampleCard({ title, description, before, after }: ExampleCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
              Before
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <NextImage
                src={before || "/placeholder.svg"}
                alt={`Before ${title}`}
                width={300}
                height={300}
                className="object-cover w-full h-auto"
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
              After
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <NextImage
                src={after || "/placeholder.svg"}
                alt={`After ${title}`}
                width={300}
                height={300}
                className="object-cover w-full h-auto"
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

type HorizontalAlignment = "left" | "center" | "right";
type VerticalAlignment = "top" | "center" | "bottom";

// Update alignment options
const horizontalAlignments = [
  { id: "left", label: "Left", icon: ArrowLeftIcon },
  { id: "center", label: "Center", icon: MoveHorizontal },
  { id: "right", label: "Right", icon: ArrowRight },
];

const verticalAlignments = [
  { id: "top", label: "Top", icon: ArrowUp },
  { id: "center", label: "Center", icon: MoveVertical },
  { id: "bottom", label: "Bottom", icon: ArrowDown },
];
// Content fill styles
const contentFillStyles = [
  {
    id: "seamless",
    label: "Seamless Extension",
    description: "Naturally extend the image content",
  },
  {
    id: "mirror",
    label: "Mirror Edges",
    description: "Reflect the edges of the image",
  },
  {
    id: "solid-color",
    label: "Solid Color",
    description: "Fill with a solid background color",
  },
  {
    id: "blur",
    label: "Blur",
    description: "Blurred extension of the image edges",
  },
  {
    id: "prompt",
    label: "AI Generated",
    description: "Generate content based on a text prompt",
  },
];

export default function ExpandImagePage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedImageInfo, setUploadedImageInfo] = useState<ImageInfo | null>(
    null,
  );
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [targetDimensions, setTargetDimensions] = useState<{
    width: number;
    height: number;
    dimensionId?: string;
  }>({
    width: 0,
    height: 0,
  });
  const [imageAlignment, setImageAlignment] = useState<{
    horizontal: HorizontalAlignment;
    vertical: VerticalAlignment;
  }>({
    horizontal: "center",
    vertical: "center",
  });

  const [expansionAmount, setExpansionAmount] = useState(50);
  const [fillStyle, setFillStyle] = useState("seamless");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [contentPrompt, setContentPrompt] = useState("");
  const [preserveSubjects, setPreserveSubjects] = useState(true);
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [matchLighting, setMatchLighting] = useState(true);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [selectionMode, setSelectionMode] = useState<
    "upload" | "gallery" | "shopify"
  >("upload");

  const app = useAppBridge();

  const onImageUploaded = (imageInfo: ImageInfo) => {
    setUploadedImageInfo(imageInfo);

    setOriginalDimensions({
      width: imageInfo.width,
      height: imageInfo.height,
    });
    const expandedWidth = Math.round(imageInfo.width * 1.5);
    const expandedHeight = Math.round(imageInfo.height * 1.5);
    setTargetDimensions({
      width: expandedWidth,
      height: expandedHeight,
    });
    setActiveTab("expand");
  };

  // const handleExpansionDirectionChange = (direction: ExpansionDirection) => {
  //   setExpansionDirection(direction);

  //   // Update target dimensions based on direction and amount
  //   const expansionFactor = 1 + expansionAmount / 100;
  //   let newWidth = originalDimensions.width;
  //   let newHeight = originalDimensions.height;
  //   if (direction.horizontal === "center") {
  //     newWidth = Math.round(originalDimensions.width * expansionFactor);
  //   } else if (
  //     direction.horizontal === "left" ||
  //     direction.horizontal === "right"
  //   ) {
  //     newWidth = Math.round(
  //       originalDimensions.width +
  //         (originalDimensions.width * (expansionAmount / 100)) / 2,
  //     );
  //   }

  //   if (direction.vertical === "center") {
  //     newHeight = Math.round(originalDimensions.height * expansionFactor);
  //   } else if (
  //     direction.vertical === "top" ||
  //     direction.vertical === "bottom"
  //   ) {
  //     newHeight = Math.round(
  //       originalDimensions.height +
  //         (originalDimensions.height * (expansionAmount / 100)) / 2,
  //     );
  //   }

  //   setTargetDimensions({ width: newWidth, height: newHeight });
  // };
  const handleExpandImage = async () => {
    if (!uploadedImageInfo) return;

    setActiveTab("result");
    setIsProcessing(true);
    setError(null); // Clear previous errors
    setTaskProgress({
      status: TaskStatus.PENDING,
      progress: 0,
    });

    try {
      const sessionToken = await app.idToken();

      const taskPayload: NewTask<EnhanceImageTaskInput> = {
        type: TaskType.EXPAND_IMAGE,
        inputData: {
          sourceImageUrl: uploadedImageInfo.uploadLocation,
          imageSourceType: ImageSourceType.URL,
          targetWidth: targetDimensions.width,
          targetHeight: targetDimensions.height,
          horizontalAlignment: imageAlignment.horizontal,
          verticalAlignment: imageAlignment.vertical,
          expandPrompt: contentPrompt,
        },
      };

      const response = await newTask<EnhanceImageTaskInput>(
        sessionToken,
        taskPayload,
      );
      const task = response.data.data;
      if (!task) {
        console.error("No task data returned");
        setIsProcessing(false);
        setError("An unexpected error occurred. Please try again.");
        return;
      }
      const websocket = new WebSocketClient(task.userId);
      websocket.on<TaskProgress>("task-progress-" + task.id, async (data) => {
        console.log("WebSocket data received:", data);
        setTaskProgress(data);
        if (data.status === TaskStatus.SUCCEEDED) {
          setIsProcessing(false);
          setError(null); // Clear any previous errors
          if (data.resultData?.outputImageUrl) {
            setExpandedImage(data.resultData.outputImageUrl);
            setIsProcessing(false);
            setActiveTab("result");
          } else {
            setError("No expanded image was generated. Please try again.");
          }
        }
        if (data.status === TaskStatus.FAILED) {
          setIsProcessing(false);
          setError(
            "Image expansion failed. Please try again with different settings.",
          );
          console.error("Task failed:", data);
        }
      });
    } catch (error) {
      setIsProcessing(false);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data.message
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
    }
  };

  const handleReset = () => {
    setUploadedImageInfo(null);
    setExpandedImage(null);
    setActiveTab("upload");
    setImageAlignment({
      horizontal: "center",
      vertical: "center",
    });
    setExpansionAmount(50);
    setFillStyle("seamless");
    setBackgroundColor("#FFFFFF");
    setContentPrompt("");
    setPreserveSubjects(true);
    setEnhanceQuality(true);
    setMatchLighting(true);
    setOriginalDimensions({ width: 0, height: 0 });
    setTargetDimensions({ width: 0, height: 0 });
    setError(null); // Clear error on reset
  };

  const handleRetry = () => {
    setError(null); // Clear error
    setExpandedImage(null);
    setTaskProgress(null);
    setActiveTab("expand"); // Go back to expand tab to adjust settings
  };

  const calculateExpansionPercentage = () => {
    if (originalDimensions.width === 0) return "0%";

    const originalArea = originalDimensions.width * originalDimensions.height;
    const newArea = targetDimensions.width * targetDimensions.height;
    const percentage = Math.round((newArea / originalArea - 1) * 100);

    return `${percentage}%`;
  };

  const handleOnShopifyFileSelected = async (url: string) => {
    const img = new window.Image();
    img.src = url;

    const [sizeRes] = await Promise.all([
      fetch(url, { method: "HEAD" }).catch(() => null),
      new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      }),
    ]);

    const size = parseInt(sizeRes?.headers.get("content-length") || "0");

    handleImageSelected([
      {
        id: url,
        url,
        name: "Shopify Image",
        originalUrl: url,
        thumbnailUrl: url,
        size: size,
        type: "image/png",
        tags: [],
        uploadDate: new Date(),
        width: img.naturalWidth || 1024,
        height: img.naturalHeight || 1024,
      },
    ] as any);
  };

  const handleImageSelected = (selectedImages: ImageType[]) => {
    if (selectedImages.length > 0) {
      onImageUploaded({
        uploadLocation: selectedImages[0].url,
        width: selectedImages[0].width ?? 0,
        height: selectedImages[0].height ?? 0,
        fileName: selectedImages[0].name,
        previewImageUrl: selectedImages[0].url,
      });
    }
    setActiveTab("expand");
  };

  // Preview of how the expansion will look
  // ...existing code...

  const getExpansionPreview = () => {
    if (!originalDimensions.width) return {};

    const originalWidth = originalDimensions.width;
    const originalHeight = originalDimensions.height;
    const targetWidth = targetDimensions.width;
    const targetHeight = targetDimensions.height;

    // Calculate width/height as percentage of target
    const width = `${(originalWidth / targetWidth) * 100}%`;
    const height = `${(originalHeight / targetHeight) * 100}%`;

    // Horizontal alignment
    let left: string;
    switch (imageAlignment.horizontal) {
      case "left":
        left = "0";
        break;
      case "right":
        left = "100%";
        break;
      case "center":
      default:
        left = "50%";
        break;
    }

    // Vertical alignment
    let top: string;
    switch (imageAlignment.vertical) {
      case "top":
        top = "0";
        break;
      case "bottom":
        top = "100%";
        break;
      case "center":
      default:
        top = "50%";
        break;
    }

    // Transform for alignment
    let translateX = "";
    let translateY = "";

    if (imageAlignment.horizontal === "left") {
      translateX = "0";
    } else if (imageAlignment.horizontal === "center") {
      translateX = "-50%";
    } else if (imageAlignment.horizontal === "right") {
      translateX = "-100%";
    }

    if (imageAlignment.vertical === "top") {
      translateY = "0";
    } else if (imageAlignment.vertical === "center") {
      translateY = "-50%";
    } else if (imageAlignment.vertical === "bottom") {
      translateY = "-100%";
    }

    const transform = `translate(${translateX}, ${translateY})`;

    return {
      position: "absolute" as const,
      left,
      top,
      width,
      height,
      transform,
    };
  };
  // ...existing code...
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              AI Image Expander
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Seamlessly extend your images beyond their original boundaries
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="upload" disabled={isProcessing}>
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="expand"
              disabled={!uploadedImageInfo || isProcessing}
            >
              Expand
            </TabsTrigger>
            <TabsTrigger
              value="result"
              disabled={!expandedImage && !isProcessing}
            >
              Result
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Select or Upload Your Image</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-center">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <div className="flex">
                          <button
                            onClick={() => setSelectionMode("upload")}
                            className={cn(
                              "px-4 py-2 rounded-md text-sm font-medium transition-all",
                              selectionMode === "upload"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                            )}
                          >
                            Upload New
                          </button>
                          <button
                            onClick={() => setSelectionMode("gallery")}
                            className={cn(
                              "px-4 py-2 rounded-md text-sm font-medium transition-all",
                              selectionMode === "gallery"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                            )}
                          >
                            Choose from Gallery
                          </button>
                          <button
                            onClick={() => setSelectionMode("shopify")}
                            className={cn(
                              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                              selectionMode === "shopify"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                            )}
                          >
                            <Layers className="h-4 w-4" />
                            Shopify
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Upload Mode */}
                    {selectionMode === "upload" && (
                      <div className="h-56">
                        <ImageUploader
                          onUploaded={onImageUploaded}
                          placeholder="Upload your own product"
                          hideImagePreviewAfterUpload
                        />
                      </div>
                    )}

                    {/* Gallery Mode */}
                    {selectionMode === "gallery" && (
                      <div className="space-y-4">
                        <ImageGallery
                          hideUploadButton
                          hideActions
                          hideCancelButton
                          maxColumns={3}
                          maxRows={2}
                          imageSelectionLimit={1}
                          onSelected={handleImageSelected}
                        />
                      </div>
                    )}

                    {/* Shopify Mode */}
                    {selectionMode === "shopify" && (
                      <ShopifyFileBrowser
                        selectedImage={uploadedImageInfo?.previewImageUrl}
                        setSelectedImage={handleOnShopifyFileSelected}
                      />
                    )}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                          Tips for best results
                        </h3>
                        <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                          <li>
                            Use images with clear edges and well-defined
                            subjects
                          </li>
                          <li>
                            Images with simple or gradient backgrounds work best
                          </li>
                          <li>
                            Avoid images with text that needs to be preserved at
                            the edges
                          </li>
                          <li>
                            For landscape expansion, choose images with natural
                            horizons
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Example Transformations
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <ExampleCard
                    title="Expand Image to Landscape"
                    description="Expand images to landscape format with seamless content extension."
                    before="/hand_bag_expand.webp"
                    after="/expand_landscaped.png"
                  />
                  <ExampleCard
                    title="Social Media Adaptation"
                    description="Expand images to fit different social media aspect ratios without cropping."
                    before="/bag_expand.jpg"
                    after="/bag_expand_protrait.png"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Expand Tab */}
          <TabsContent value="expand" className="space-y-4">
            {uploadedImageInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Expansion Settings
                    </h2>
                    <div className="space-y-6 mb-8">
                      {/* Image Dimensions */}
                      <div className="space-y-4">
                        <Label>Image Dimensions</Label>
                        <div className="flex flex-wrap gap-4">
                          {[
                            {
                              id: "square",
                              label: "Square",
                              width: 24,
                              height: 24,
                            },
                            {
                              id: "9:16",
                              label: "9:16",
                              width: 18,
                              height: 32,
                            },
                            {
                              id: "16:9",
                              label: "16:9",
                              width: 32,
                              height: 18,
                            },
                            { id: "4:3", label: "4:3", width: 18, height: 24 },
                            { id: "3:4", label: "3:4", width: 24, height: 18 },
                            {
                              id: "custom",
                              label: "Custom",
                              width: 65,
                              height: 34,
                            },
                          ].map((dimension) => (
                            <label
                              key={dimension.id}
                              htmlFor={`dimension-${dimension.id}`}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded transition-all",
                                dimension.id === targetDimensions.dimensionId
                                  ? "bg-blue-50"
                                  : "bg-white hover:bg-gray-50",
                              )}
                            >
                              <input
                                type="radio"
                                id={`dimension-${dimension.id}`}
                                name="image-dimension"
                                value={dimension.id}
                                checked={
                                  dimension.id === targetDimensions.dimensionId
                                }
                                onChange={() => {
                                  if (dimension.id === "custom") {
                                    setTargetDimensions({
                                      width: targetDimensions.width,
                                      height: targetDimensions.height,
                                      dimensionId: dimension.id,
                                    });
                                  } else if (dimension.id === "square") {
                                    const maxSide = Math.max(
                                      originalDimensions.width,
                                      originalDimensions.height,
                                    );
                                    setTargetDimensions({
                                      width: maxSide * 2,
                                      height: maxSide * 2,
                                      dimensionId: dimension.id,
                                    });
                                  } else {
                                    const [w, h] = dimension.id
                                      .split(":")
                                      .map(Number);
                                    setTargetDimensions({
                                      width: Math.max(
                                        Math.round(
                                          (originalDimensions.height * w) / h,
                                        ),
                                        originalDimensions.width,
                                      ),
                                      height: Math.max(
                                        Math.round(
                                          (originalDimensions.width * h) / w,
                                        ),
                                        originalDimensions.height,
                                      ),
                                      dimensionId: dimension.id,
                                    });
                                  }
                                }}
                                className="sr-only"
                              />
                              <div
                                className={cn(
                                  "border-2 rounded mb-1",
                                  dimension.id === targetDimensions.dimensionId
                                    ? "border-blue-500"
                                    : "border-gray-400",
                                )}
                                style={{
                                  width:
                                    targetDimensions.dimensionId === "custom" &&
                                    dimension.id === "custom"
                                      ? "20px"
                                      : dimension.width,
                                  height:
                                    targetDimensions.dimensionId === "custom" &&
                                    dimension.id === "custom"
                                      ? "30px"
                                      : dimension.height,
                                  maxWidth: "32px",
                                  maxHeight: "32px",
                                  animation:
                                    targetDimensions.dimensionId === "custom" &&
                                    dimension.id === "custom"
                                      ? "pulse 1.5s infinite"
                                      : "none",
                                }}
                              />
                              <style jsx>{`
                                @keyframes pulse {
                                  0% {
                                    width: 5px;
                                    height: 10px;
                                  }
                                  50% {
                                    width: 20px;
                                    height: 25px;
                                  }
                                  100% {
                                    width: 10px;
                                    height: 5px;
                                  }
                                }
                              `}</style>
                              <span className="text-sm font-medium text-gray-700">
                                {dimension.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {targetDimensions.dimensionId === "custom" && (
                          <div className="flex gap-4 mt-4">
                            <div className="flex-1">
                              <Label className="text-sm text-slate-500 mb-1">
                                Custom Width
                              </Label>
                              <Input
                                type="number"
                                value={targetDimensions.width || ""}
                                onChange={(e) =>
                                  setTargetDimensions((prev) => ({
                                    ...prev,
                                    width: parseInt(e.target.value) || 0,
                                  }))
                                }
                                placeholder="Width"
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-sm text-slate-500 mb-1">
                                Custom Height
                              </Label>
                              <Input
                                type="number"
                                value={targetDimensions.height || ""}
                                onChange={(e) =>
                                  setTargetDimensions((prev) => ({
                                    ...prev,
                                    height: parseInt(e.target.value) || 0,
                                  }))
                                }
                                placeholder="Height"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6">
                      {/* --- Replace Expansion Direction with Image Alignment --- */}
                      <div className="space-y-4">
                        <Label>Image Alignment</Label>
                        <div className="flex flex-col gap-4">
                          {/* Horizontal */}
                          <div>
                            <Label className="text-sm text-slate-500 mb-1">
                              Horizontal
                            </Label>
                            <div className="flex gap-2 mt-2">
                              {horizontalAlignments.map((alignment) => {
                                const Icon = alignment.icon;
                                return (
                                  <label
                                    key={alignment.id}
                                    htmlFor={`horizontal-${alignment.id}`}
                                    className={cn(
                                      "flex flex-row items-center px-6 py-2 rounded cursor-pointer border",
                                      imageAlignment.horizontal === alignment.id
                                        ? "bg-purple-600 text-white border-purple-700"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      id={`horizontal-${alignment.id}`}
                                      name="horizontal-alignment"
                                      value={alignment.id}
                                      checked={
                                        imageAlignment.horizontal ===
                                        alignment.id
                                      }
                                      onChange={() =>
                                        setImageAlignment((prev) => ({
                                          ...prev,
                                          horizontal:
                                            alignment.id as HorizontalAlignment,
                                        }))
                                      }
                                      className="sr-only"
                                    />
                                    <Icon className="h-6 w-8" />
                                    <span className="text-xs">
                                      {alignment.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          {/* Vertical */}
                          <div>
                            <Label className="text-sm text-slate-500 mb-1">
                              Vertical
                            </Label>
                            <div className="flex gap-2 mt-2">
                              {verticalAlignments.map((alignment) => {
                                const Icon = alignment.icon;
                                return (
                                  <label
                                    key={alignment.id}
                                    htmlFor={`vertical-${alignment.id}`}
                                    className={cn(
                                      "flex flex-row items-center py-2 px-6 rounded cursor-pointer border",
                                      imageAlignment.vertical === alignment.id
                                        ? "bg-purple-600 text-white border-purple-700"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      id={`vertical-${alignment.id}`}
                                      name="vertical-alignment"
                                      value={alignment.id}
                                      checked={
                                        imageAlignment.vertical === alignment.id
                                      }
                                      onChange={() =>
                                        setImageAlignment((prev) => ({
                                          ...prev,
                                          vertical:
                                            alignment.id as VerticalAlignment,
                                        }))
                                      }
                                      className="sr-only"
                                    />
                                    <Icon className="h-6 w-8" />
                                    <span className="text-xs">
                                      {alignment.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* --- End Image Alignment --- */}
                      {/* ...rest of settings... */}
                    </div>
                    {/* Expanded prompt */}
                    <div className="space-y-6 mt-8">
                      <div className="space-y-2">
                        <Label htmlFor="content-prompt">
                          Content Generation Prompt
                        </Label>
                        <Textarea
                          id="content-prompt"
                          placeholder="Describe what you want to appear in the expanded areas. Leave blank for seamless expansion."
                          value={contentPrompt}
                          onChange={(e) => setContentPrompt(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                      <Button
                        onClick={handleExpandImage}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                        disabled={
                          isProcessing ||
                          (fillStyle === "prompt" && !contentPrompt)
                        }
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Maximize className="mr-2 h-4 w-4" />
                            {`${getPointsForTaskType(TaskType.EXPAND_IMAGE)} Credits • Expand Image`}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Preview
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative">
                        <div
                          className="w-full"
                          style={{
                            paddingTop: `${(targetDimensions.height / targetDimensions.width) * 100}%`,
                            backgroundColor:
                              fillStyle === "solid-color"
                                ? backgroundColor
                                : "#1e293b",
                          }}
                        >
                          {uploadedImageInfo && (
                            <div className="absolute inset-0">
                              <div
                                className="absolute"
                                style={
                                  getExpansionPreview() as React.CSSProperties
                                }
                              >
                                <div className="w-full h-full bg-purple-500/20 border border-purple-500/40">
                                  <Image
                                    src={
                                      uploadedImageInfo.previewImageUrl ||
                                      "/placeholder.svg"
                                    }
                                    alt="Uploaded image"
                                    height={uploadedImageInfo.height}
                                    width={uploadedImageInfo.width}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              {/* Show expansion areas */}
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-full border-2 border-dashed border-purple-500/30" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {targetDimensions.width} × {targetDimensions.height}px
                        </div>
                      </div>

                      <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-2">
                          Expansion Information
                        </h3>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Direction:
                            </span>
                            <span className="font-medium capitalize">
                              Horizontal Alignment:{" "}
                              <span className="lowercase">
                                {imageAlignment.horizontal}
                              </span>
                              , Vertical Alignment:{" "}
                              <span className="lowercase">
                                {imageAlignment.vertical}
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Expansion:
                            </span>
                            <span className="font-medium">
                              {calculateExpansionPercentage()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Result Tab */}
          <TabsContent value="result" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <Card className="w-full max-w-4xl flex-col items-center justify-center" />
              <Card className="w-full max-w-4xl mx-auto overflow-hidden">
                <CardContent className="p-6">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px]">
                      <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                      <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                        Expanding your image...
                      </p>
                      <p className="text-sm text-center text-slate-500 dark:text-slate-500 mt-2 max-w-md">
                        Creating seamless expansion with{" "}
                        {contentFillStyles
                          .find((s) => s.id === fillStyle)
                          ?.label.toLowerCase()}
                      </p>
                    </div>
                  ) : error ? (
                    <Card className="w-full max-w-2xl mx-auto">
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                              Expansion Failed
                            </h3>
                            <p className="text-red-500 text-sm mb-6">{error}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                            <Button
                              onClick={handleRetry}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Try Again
                            </Button>
                            <Button
                              onClick={handleReset}
                              variant="outline"
                              className="flex-1"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Start Over
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : expandedImage ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                            Original
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                            <Image
                              src={
                                uploadedImageInfo?.previewImageUrl ||
                                "/placeholder.svg"
                              }
                              alt="Original image"
                              height={uploadedImageInfo?.height}
                              width={uploadedImageInfo?.width}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                            Expanded
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <EnhancedImage
                              src={expandedImage || "/placeholder.svg"}
                              alt="Expanded image"
                              height={targetDimensions.height}
                              width={targetDimensions.width}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-2">
                          Expansion Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Original Size:
                            </span>
                            <span className="font-medium">
                              {originalDimensions.width} ×{" "}
                              {originalDimensions.height}px
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              New Size:
                            </span>
                            <span className="font-medium">
                              {targetDimensions.width} ×{" "}
                              {targetDimensions.height}px
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Expansion:
                            </span>
                            <span className="font-medium">
                              {calculateExpansionPercentage()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Direction:
                            </span>
                            <span className="font-medium capitalize">
                              Horizontal Alignment:{" "}
                              <span className="lowercase">
                                {imageAlignment.horizontal}
                              </span>
                              , Vertical Alignment:{" "}
                              <span className="lowercase">
                                {imageAlignment.vertical}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          onClick={() => setActiveTab("expand")}
                          variant="outline"
                          className="flex-1"
                        >
                          Adjust Settings
                        </Button>
                        <ShopifyImageActions
                          filePrefix="expand-image"
                          images={expandedImage}
                          selectedImageIndex={0}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[500px]">
                      <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                        Process your image to see the result
                      </p>
                      <Button
                        onClick={() => setActiveTab("upload")}
                        variant="outline"
                        className="mt-4"
                      >
                        Go to Upload
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* How It Works Section */}
        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">1. Upload</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Upload any image you want to expand. Our AI works with photos,
                  artwork, and designs.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Maximize className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">2. Customize</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Choose expansion direction, amount, and fill style. Preview
                  how your expanded image will look.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">3. Download</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Get your seamlessly expanded image with perfect content
                  continuation, ready for any use.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Perfect For
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">Social Media</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Adapt images to different platform aspect ratios
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">Web Design</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Create responsive versions of images for different devices
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">Photography</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Convert portrait to landscape or add space for text
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">Marketing</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Create banner variations from a single product image
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
