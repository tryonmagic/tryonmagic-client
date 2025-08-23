"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Wand2,
  Loader2,
  Trash2,
  Info,
  ZoomIn,
  X,
  Maximize2,
  Loader,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, toCamelCase } from "@/lib/utils";
import { newTask as upscaleImageTask } from "@/lib/api/tasks";
import {
  ImageSourceType,
  NewTask,
  TaskProgress,
  TaskStatus,
  TaskStatusMessageMapping,
  TaskType,
  UpscaleTaskInput,
} from "@/lib/api/type";
import { useAppBridge } from "@shopify/app-bridge-react";
import { WebSocketClient } from "@/socket";
import ImageUploader, {
  ImageInfo,
} from "@/lib/uploader/components/ImageUploader";
import Image from "next/image";
import { getImageDimensions } from "@/lib/uploader/utils";
import { AxiosError } from "axios";
import EnhancedImage from "@/components/ui/EnhanchedImage";

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

export default function UpscalePage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedImageInfo, setUploadedImageInfo] = useState<ImageInfo | null>(
    null,
  );
  const [upscaledImage, setUpscaledImage] = useState<{
    url: string;
    width?: number;
    height?: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [upscaleFactor, setUpscaleFactor] = useState(TaskType.UPSCALE);
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [reduceNoise, setReduceNoise] = useState(true);
  const [preserveDetails, setPreserveDetails] = useState(true);
  const [sharpness, setSharpness] = useState(50);
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [customDimensions, setCustomDimensions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const app = useAppBridge();
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);

  // Error states
  const [upscaleError, setUpscaleError] = useState<string | null>(null);

  // Fullscreen preview states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenView, setFullscreenView] = useState<
    "original" | "enhanced" | "comparison"
  >("comparison");

  const onImageUploaded = (imageInfo: ImageInfo) => {
    setUploadedImageInfo(imageInfo);

    setOriginalDimensions({
      width: imageInfo.width,
      height: imageInfo.height,
    });
    const upscale = Number.parseInt(upscaleFactor.replace("x", ""));
    setTargetWidth(String(imageInfo.width * upscale));
    setTargetHeight(String(imageInfo.height * upscale));

    setActiveTab("enhance");
  };

  const handleUpscaleFactor = (value: string) => {
    setUpscaleFactor(value as TaskType);

    if (!customDimensions && originalDimensions.width > 0) {
      const factor = Number.parseInt(value.replace("x", ""));
      setTargetWidth(String(originalDimensions.width * factor));
      setTargetHeight(String(originalDimensions.height * factor));
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setTargetWidth(newWidth);

    if (maintainAspectRatio && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.height / originalDimensions.width;
      setTargetHeight(
        String(Math.round(Number.parseInt(newWidth) * aspectRatio)),
      );
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setTargetHeight(newHeight);

    if (maintainAspectRatio && originalDimensions.height > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setTargetWidth(
        String(Math.round(Number.parseInt(newHeight) * aspectRatio)),
      );
    }
  };

  const handleUpscale = async () => {
    if (!uploadedImageInfo) return;

    try {
      // Clear previous errors
      setUpscaleError(null);
      setTaskProgress({
        status: TaskStatus.PENDING,
        progress: 0,
      });
      setIsProcessing(true);

      const sessionToken = await app.idToken();

      const newTask: NewTask<UpscaleTaskInput> = {
        type:
          upscaleFactor === ("RELIGHT" as TaskType)
            ? TaskType.ENHANCE
            : TaskType.UPSCALE,
        inputData: {
          sourceImageUrl: uploadedImageInfo.uploadLocation,
          // scale: upscaleFactor,
          imageSourceType: ImageSourceType.URL,
        },
      };

      const response = await upscaleImageTask<UpscaleTaskInput>(
        sessionToken,
        newTask,
      );
      const task = response.data.data;
      if (!task) {
        const errorMessage = "Something went wrong, please try again";
        setUpscaleError(errorMessage);
        setTaskProgress(null);
        setIsProcessing(false);
        return;
      }

      const websocket = new WebSocketClient(task.userId);
      websocket.on<TaskProgress>("task-progress-" + task.id, async (data) => {
        console.log("WebSocket data received:", data);
        setTaskProgress(data);
        if (data.status === TaskStatus.SUCCEEDED) {
          setIsProcessing(false);
          setActiveTab("result");
          if (data.resultData?.outputImageUrl) {
            setUpscaledImage({
              url: data.resultData.outputImageUrl,
            });
            const dimension = await getImageDimensions(
              data.resultData.outputImageUrl,
            );
            console.log("Image dimensions:", dimension);
            setUpscaledImage({
              url: data.resultData.outputImageUrl,
              width: dimension.width,
              height: dimension.height,
            });
            setTargetHeight(String(dimension.height));
            setTargetWidth(String(dimension.width));
          }
        } else if (data.status === TaskStatus.FAILED) {
          const errorMessage = "Failed to upscale image";
          setUpscaleError(errorMessage);
          setTaskProgress(null);
          setIsProcessing(false);
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data.message
          : "Failed to upscale image. Please try again.";
      setUpscaleError(errorMessage);
      setTaskProgress(null);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedImageInfo(null);
    setUpscaledImage(null);
    setActiveTab("upload");
    setUpscaleFactor(TaskType.UPSCALE);
    setEnhanceQuality(true);
    setReduceNoise(true);
    setPreserveDetails(true);
    setSharpness(50);
    setOriginalDimensions({ width: 0, height: 0 });
    setTargetWidth("");
    setTargetHeight("");
    setMaintainAspectRatio(true);
    setCustomDimensions(false);
    setUpscaleError(null);
    setTaskProgress(null);
    setIsFullscreenOpen(false);
    setFullscreenView("comparison");
  };

  const handleDownload = async () => {
    if (!upscaledImage?.url) return;

    try {
      // Fetch the image as a blob
      const response = await fetch(upscaledImage.url);
      const blob = await response.blob();

      // Create a download URL
      const downloadUrl = URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `upscaled-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const calculateUpscalePercentage = () => {
    if (originalDimensions.width === 0 || targetWidth === "") return "0%";

    const originalPixels = originalDimensions.width * originalDimensions.height;
    const newPixels =
      Number.parseInt(targetWidth) * Number.parseInt(targetHeight);
    const percentage = Math.round((newPixels / originalPixels - 1) * 100);

    return `${percentage}%`;
  };

  const isTaskProcessing = taskProgress
    ? [TaskStatus.PROCESSING, TaskStatus.PENDING, TaskStatus.QUEUED].includes(
        taskProgress?.status,
      )
    : false;

  const hasErrors = !!upscaleError;

  const openFullscreen = (
    view: "original" | "enhanced" | "comparison" = "comparison",
  ) => {
    setFullscreenView(view);
    setIsFullscreenOpen(true);
  };

  const toggleFullscreenView = () => {
    if (fullscreenView === "comparison") {
      setFullscreenView("original");
    } else if (fullscreenView === "original") {
      setFullscreenView("enhanced");
    } else {
      setFullscreenView("comparison");
    }
  };

  // Keyboard event handler for fullscreen modal
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isFullscreenOpen) {
        switch (event.key) {
          case "Escape":
            setIsFullscreenOpen(false);
            break;
          case "ArrowLeft":
            if (fullscreenView === "enhanced") {
              setFullscreenView("original");
            } else if (fullscreenView === "original") {
              setFullscreenView("comparison");
            }
            break;
          case "ArrowRight":
            if (fullscreenView === "original") {
              setFullscreenView("enhanced");
            } else if (fullscreenView === "enhanced") {
              setFullscreenView("comparison");
            }
            break;
          case "c":
          case "C":
            setFullscreenView("comparison");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isFullscreenOpen, fullscreenView]);

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
              AI Image Upscaler
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enhance image resolution and quality with AI-powered upscaling
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="upload" disabled={isTaskProcessing}>
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="enhance"
              disabled={!uploadedImageInfo || (isTaskProcessing && !hasErrors)}
            >
              Enhance
            </TabsTrigger>
            <TabsTrigger
              value="result"
              disabled={!upscaledImage && !isTaskProcessing}
            >
              Result
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                    Upload Your Image
                  </h2>
                  <div className="space-y-4">
                    <ImageUploader onUploaded={onImageUploaded} />
                    {/* <div className="mt-32" />
                    <div>
                      <Button
                        onClick={handleUpscale}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                        disabled={!uploadedImageInfo || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Upscale Image
                          </>
                        )}
                      </Button>
                    </div> */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                            Tips for best results
                          </h3>
                          <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                            <li>
                              Use images with clear details you want to enhance
                            </li>
                            <li>
                              Higher quality source images yield better results
                            </li>
                            {/* <li>
                              Upscaling works best up to 4x the original size
                            </li> */}
                            <li>
                              For very low resolution images, use the quality
                              enhancement option
                            </li>
                          </ul>
                        </div>
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
                    title="Low Resolution Photo"
                    description="Upscaled from 480p to 4K with enhanced details and reduced noise."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                  />
                  <ExampleCard
                    title="Old Photograph"
                    description="Restored and upscaled with improved clarity and detail preservation."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Enhance Tab */}
          <TabsContent value="enhance" className="space-y-4">
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
                      {/* Upscale Settings */}
                      Enhance Settings
                    </h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        {/* <Label>Upscale Factor</Label> */}
                        <div className="grid grid-cols-4 gap-2">
                          {["UPSCALE", "RELIGHT"].map((factor) => (
                            <Button
                              key={factor}
                              type="button"
                              variant={
                                upscaleFactor === factor ? "default" : "outline"
                              }
                              className={cn(
                                upscaleFactor === factor &&
                                  "bg-purple-600 hover:bg-purple-700",
                                factor === "Custom" &&
                                  customDimensions &&
                                  "bg-purple-600 hover:bg-purple-700 text-white",
                              )}
                              onClick={() => {
                                if (factor === "Custom") {
                                  setCustomDimensions(true);
                                } else {
                                  setCustomDimensions(false);
                                  handleUpscaleFactor(factor);
                                }
                              }}
                            >
                              {factor[0].toUpperCase() +
                                factor.slice(1).toLowerCase()}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {(customDimensions ||
                        upscaleFactor === ("Custom" as TaskType)) && (
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="maintain-ratio"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Maintain Aspect Ratio
                            </Label>
                            <Switch
                              id="maintain-ratio"
                              checked={maintainAspectRatio}
                              onCheckedChange={setMaintainAspectRatio}
                              className="data-[state=checked]:bg-purple-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="target-width">Width (px)</Label>
                              <Input
                                id="target-width"
                                type="number"
                                value={targetWidth}
                                onChange={handleWidthChange}
                                min={originalDimensions.width}
                                placeholder="Width in pixels"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="target-height">Height (px)</Label>
                              <Input
                                id="target-height"
                                type="number"
                                value={targetHeight}
                                onChange={handleHeightChange}
                                min={originalDimensions.height}
                                placeholder="Height in pixels"
                              />
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>
                              Original: {originalDimensions.width} ×{" "}
                              {originalDimensions.height}px
                            </span>
                            <span>
                              Increase: {calculateUpscalePercentage()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sharpness">
                            Sharpness Enhancement
                          </Label>
                          <span className="text-sm text-slate-500">
                            {sharpness}%
                          </span>
                        </div>
                        <Slider
                          id="sharpness"
                          min={0}
                          max={100}
                          step={1}
                          value={[sharpness]}
                          onValueChange={(value) => setSharpness(value[0])}
                          className="py-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="enhance-quality"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Enhance Quality
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Improve overall image quality and clarity
                          </p>
                        </div>
                        <Switch
                          id="enhance-quality"
                          checked={enhanceQuality}
                          onCheckedChange={setEnhanceQuality}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="reduce-noise"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Reduce Noise
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Remove grain and digital noise
                          </p>
                        </div>
                        <Switch
                          id="reduce-noise"
                          checked={reduceNoise}
                          onCheckedChange={setReduceNoise}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="preserve-details"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Preserve Details
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Maintain fine details during upscaling
                          </p>
                        </div>
                        <Switch
                          id="preserve-details"
                          checked={preserveDetails}
                          onCheckedChange={setPreserveDetails}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div> */}

                      <div className="mt-32" />
                      <Button
                        onClick={handleUpscale}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                        disabled={isTaskProcessing}
                      >
                        {isTaskProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="truncate">
                              {taskProgress &&
                                TaskStatusMessageMapping[taskProgress.status]}
                            </span>
                          </>
                        ) : upscaleError ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              Retry {toCamelCase(upscaleFactor)}
                            </span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            <span className="truncate">
                              {toCamelCase(upscaleFactor)} Image
                            </span>
                          </>
                        )}
                      </Button>

                      {upscaleError && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {upscaleError}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Preview
                    </h2>
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Image
                        src={
                          uploadedImageInfo.previewImageUrl ||
                          "/placeholder.svg"
                        }
                        alt="Uploaded image"
                        height={uploadedImageInfo.height}
                        width={uploadedImageInfo.width}
                        className="w-full h-auto object-contain"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={handleReset}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                      <h3 className="font-medium text-sm mb-2">
                        Image Information
                      </h3>
                      <div className="grid grid-rows gap-x-4 gap-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Dimensions:
                          </span>
                          <span className="font-medium">
                            {originalDimensions.width} ×{" "}
                            {originalDimensions.height}px
                          </span>
                        </div>
                        {/* <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Target Size:
                          </span>
                          <span className="font-medium">
                            {targetWidth} × {targetHeight}px
                          </span>
                        </div> */}
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Enhance Option
                          </span>
                          <span className="font-medium">
                            {customDimensions
                              ? calculateUpscalePercentage()
                              : toCamelCase(upscaleFactor)}
                          </span>
                        </div>
                        {/* <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Quality Enhancement:
                          </span>
                          <span className="font-medium flex items-center">
                            {enhanceQuality ? (
                              <>
                                <Check className="h-3 w-3 text-green-500 mr-1" />
                                Enabled
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 text-red-500 mr-1" />
                                Disabled
                              </>
                            )}
                          </span>
                        </div> */}
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
              <Card className="w-full max-w-4xl mx-auto overflow-hidden">
                <CardContent className="p-6">
                  {isTaskProcessing ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px]">
                      <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                      <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                        {toCamelCase(upscaleFactor) === "Upscale"
                          ? "Upscaling"
                          : "Enhancing"}{" "}
                        your image...
                      </p>
                      <p className="text-sm text-center text-slate-500 dark:text-slate-500 mt-2 max-w-md">
                        {taskProgress &&
                          TaskStatusMessageMapping[taskProgress.status]}
                      </p>
                    </div>
                  ) : upscaledImage ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                            Original
                          </p>
                          <div
                            className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                            onClick={() => openFullscreen("original")}
                          >
                            {uploadedImageInfo && (
                              <Image
                                src={
                                  uploadedImageInfo.previewImageUrl ||
                                  "/placeholder.svg"
                                }
                                width={uploadedImageInfo.width}
                                height={uploadedImageInfo.height}
                                alt="Original image"
                                className="w-full h-auto object-contain"
                              />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="secondary" size="sm">
                                        <Maximize2 className="h-4 w-4 mr-1" />
                                        View Full
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View in fullscreen</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Button variant="secondary" size="sm">
                                  {originalDimensions.width} ×{" "}
                                  {originalDimensions.height}px
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                            {upscaleFactor === ("RELIGHT" as TaskType)
                              ? "Relight"
                              : "Upscaled"}
                          </p>
                          <div
                            className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                            onClick={() => openFullscreen("enhanced")}
                          >
                            <EnhancedImage
                              src={upscaledImage.url}
                              alt="Upscaled image"
                              width={upscaledImage.width || 500}
                              height={upscaledImage.height || 700}
                              className="w-full h-auto object-contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="secondary" size="sm">
                                        <Maximize2 className="h-4 w-4 mr-1" />
                                        View Full
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View in fullscreen</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {upscaledImage.width && (
                                  <Button variant="secondary" size="sm">
                                    {upscaledImage.width} ×{" "}
                                    {upscaledImage.height}px
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {upscaleFactor !== ("RELIGHT" as TaskType) && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                          <h3 className="font-medium text-sm mb-2">
                            Upscaling Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-1 gap-x-4 gap-y-2 text-xs">
                            <div className="col flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">
                                Upscaled By:
                              </span>
                              <span className="font-medium">
                                {calculateUpscalePercentage()}
                              </span>
                            </div>
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
                                {upscaledImage.width ? (
                                  `${upscaledImage.width} × ${upscaledImage.height}px`
                                ) : (
                                  <Loader className="h-3 w-3 animate-spin" />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-4">
                        <Button
                          onClick={() => setActiveTab("enhance")}
                          variant="outline"
                          className="flex-1"
                        >
                          Adjust Settings
                        </Button>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="flex-1"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          New Image
                        </Button>
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

        {/* Fullscreen Preview Modal */}
        {isFullscreenOpen && uploadedImageInfo && upscaledImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-7xl max-h-full flex flex-col">
              {/* Header with controls */}
              <div className="flex items-center justify-between mb-4 bg-black bg-opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-white text-lg font-semibold">
                    {fullscreenView === "comparison"
                      ? "Image Comparison"
                      : fullscreenView === "original"
                        ? "Original Image"
                        : upscaleFactor === ("RELIGHT" as TaskType)
                          ? "Enhanced Image"
                          : "Upscaled Image"}
                  </h3>
                  {fullscreenView !== "comparison" && (
                    <div className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      {fullscreenView === "original"
                        ? `${originalDimensions.width} × ${originalDimensions.height}px`
                        : upscaledImage.width
                          ? `${upscaledImage.width} × ${upscaledImage.height}px`
                          : "Loading..."}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFullscreenView("comparison")}
                    className={cn(
                      "bg-white bg-opacity-20 hover:bg-opacity-30 text-white",
                      fullscreenView === "comparison" &&
                        "bg-white bg-opacity-40",
                    )}
                  >
                    Side by Side
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleFullscreenView}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
                  >
                    {fullscreenView === "comparison"
                      ? "Original Only"
                      : fullscreenView === "original"
                        ? `${upscaleFactor === ("RELIGHT" as TaskType) ? "Enhanced" : "Upscaled"} Only`
                        : "Side by Side"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFullscreenOpen(false)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image container */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                {fullscreenView === "comparison" ? (
                  /* Side by side comparison */
                  <div className="grid grid-cols-2 gap-4 w-full h-full max-w-full max-h-full">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-white text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        Original ({originalDimensions.width} ×{" "}
                        {originalDimensions.height}px)
                      </div>
                      <div className="flex-1 flex items-center justify-center max-w-full max-h-full">
                        <Image
                          src={
                            uploadedImageInfo.previewImageUrl ||
                            "/placeholder.svg"
                          }
                          width={uploadedImageInfo.width}
                          height={uploadedImageInfo.height}
                          alt="Original image fullscreen"
                          className="max-w-full max-h-full object-contain cursor-pointer"
                          onClick={() => setFullscreenView("original")}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-white text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        {upscaleFactor === ("RELIGHT" as TaskType)
                          ? "Enhanced"
                          : "Upscaled"}
                        {upscaledImage.width &&
                          ` (${upscaledImage.width} × ${upscaledImage.height}px)`}
                      </div>
                      <div className="flex-1 flex items-center justify-center max-w-full max-h-full">
                        <EnhancedImage
                          src={upscaledImage.url}
                          alt="Enhanced image fullscreen"
                          width={upscaledImage.width || 500}
                          height={upscaledImage.height || 700}
                          className="max-w-full max-h-full object-contain cursor-pointer"
                          onClick={() => setFullscreenView("enhanced")}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single image view */
                  <div className="relative max-w-full max-h-full">
                    {fullscreenView === "original" ? (
                      <Image
                        src={
                          uploadedImageInfo.previewImageUrl ||
                          "/placeholder.svg"
                        }
                        width={uploadedImageInfo.width}
                        height={uploadedImageInfo.height}
                        alt="Original image fullscreen"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <EnhancedImage
                        src={upscaledImage.url}
                        alt="Enhanced image fullscreen"
                        width={upscaledImage.width || 500}
                        height={upscaledImage.height || 700}
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Navigation hint */}
              <div className="text-center mt-4">
                <p className="text-white text-sm opacity-70">
                  {fullscreenView === "comparison"
                    ? "Click on images to view individually • Press C for comparison • ESC to close"
                    : "Use arrow keys to navigate • Press C for side-by-side • ESC to close"}
                </p>
              </div>
            </div>
          </div>
        )}

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
                  Upload any image you want to enhance. Our AI works with
                  photos, artwork, and screenshots.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <ZoomIn className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">2. Customize</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Choose your upscale factor and enhancement options. Adjust
                  settings for optimal results.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Maximize2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">3. Download</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Get your high-resolution image with enhanced details and
                  quality, ready for any use.
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
                <h3 className="text-base font-bold mb-1">Old Photos</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Restore and enhance vintage or low-quality photographs
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">Print Media</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Prepare images for high-quality printing at larger sizes
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">Digital Art</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Upscale digital artwork for higher resolution displays
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <h3 className="text-base font-bold mb-1">E-commerce</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Enhance product photos for better customer experience
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
