"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Eraser,
  Loader2,
  Download,
  Trash2,
  Info,
  ImageIcon,
  Palette,
  Sparkles,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import ImageUploadDialog, {
  ImageGallery,
} from "@/lib/uploader/components/image-upload-manager";
import {
  BackgroundSourceType,
  ImageSourceType,
  NewTask,
  RemoveBackgroundTaskInput,
  ReplaceBackgroundTaskInput,
  TaskProgress,
  TaskStatus,
  TaskStatusMessageMapping,
  TaskType,
} from "@/lib/api/type";
import { newTask as removeBackgroundTask } from "@/lib/api/tasks";
import { useAppBridge } from "@shopify/app-bridge-react";
import { WebSocketClient } from "@/socket";
import EnhancedImage from "@/components/ui/EnhanchedImage";
import { AxiosError } from "axios";
import ImageUploader from "@/lib/uploader/components/ImageUploader";

// Predefined background colors
const backgroundColors = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Transparent", value: "transparent" },
  { name: "Red", value: "#FF0000" },
  { name: "Green", value: "#00FF00" },
  { name: "Blue", value: "#0000FF" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#800080" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Gray", value: "#808080" },
  { name: "Orange", value: "#FFA500" },
  { name: "Cyan", value: "#00FFFF" },
  { name: "Magenta", value: "#FF00FF" },
  { name: "Brown", value: "#A52A2A" },
  { name: "Navy", value: "#000080" },
  { name: "Teal", value: "#008080" },
  { name: "Lime", value: "#00FF00" },
  { name: "Maroon", value: "#800000" },
  { name: "Olive", value: "#808000" },
  { name: "Silver", value: "#C0C0C0" },
];

// Predefined background prompts
const backgroundPrompts = [
  "Studio with soft lighting and neutral backdrop",
  "Outdoor natural landscape with mountains and sky",
  "Urban cityscape with blurred buildings",
  "Minimalist white room with subtle shadows",
  "Gradient blue to purple abstract background",
  "Luxury marble surface with gold accents",
];

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
              <Image
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
              <Image
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

interface CustomColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

function CustomColorPicker({
  selectedColor,
  onColorSelect,
}: CustomColorPickerProps) {
  const [customColor, setCustomColor] = useState(selectedColor || "#FFFFFF");
  const [isValidColor, setIsValidColor] = useState(true);

  // Update local state when selectedColor prop changes
  useEffect(() => {
    if (selectedColor) {
      setCustomColor(selectedColor);
    }
  }, [selectedColor]);

  const validateAndSetColor = (color: string) => {
    setCustomColor(color);

    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const isValid = hexRegex.test(color);
    setIsValidColor(isValid);

    if (isValid) {
      onColorSelect(color);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setIsValidColor(true);
    onColorSelect(color);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Custom Color</Label>
      <div className="flex space-x-3">
        {/* Color Picker */}
        <div className="relative">
          <input
            type="color"
            value={customColor}
            onChange={handleColorPickerChange}
            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer overflow-hidden"
            title="Pick a color"
          />
        </div>

        {/* Hex Input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="#FFFFFF"
            value={customColor}
            onChange={(e) => validateAndSetColor(e.target.value)}
            className={cn(
              "font-mono text-sm",
              !isValidColor && "border-red-500 focus:border-red-500",
            )}
          />
          {!isValidColor && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid hex color (e.g., #FFFFFF)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RemoveBGPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedImage, setUploadedImage] = useState<{
    previewUrl: string;
    originalUrl: string;
  } | null>(null);
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [backgroundType, setBackgroundType] = useState<BackgroundSourceType>(
    BackgroundSourceType.COLOR,
  );
  const [replaceBgSelectedColor, setReplaceBgSelectedColor] =
    useState("#FFFFFF");
  const [customColor, setCustomColor] = useState("");
  const [replaceBgSelectedImage, setReplaceBgSelectedImage] = useState<
    string | null
  >(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [edgeRefinement, setEdgeRefinement] = useState(50);
  const [detailPreservation, setDetailPreservation] = useState(true);
  const [hairDetection, setHairDetection] = useState(true);
  const customImageInputRef = useRef<HTMLInputElement>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Error states
  const [removeBgError, setRemoveBgError] = useState<string | null>(null);
  const [replaceBgError, setReplaceBgError] = useState<string | null>(null);
  const [uploadImageTab, setUploadImageTab] = useState("new");
  const [customImageUrlError, setCustomImageUrlError] = useState<string | null>(
    null,
  );

  const [openImageUploadDialog, setOpenImageUploadDialog] = useState(false);
  const app = useAppBridge();

  console.log({ replaceBgSelectedImage });

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReplaceBgSelectedImage(event.target?.result as string);
        setCustomImageUrl("");
        setCustomImageUrlError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (no error)

    try {
      const urlObj = new URL(url);
      // Check if it's a valid HTTP/HTTPS URL
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return false;
      }

      // Check if it has a valid image extension
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
        ".svg",
      ];
      const pathname = urlObj.pathname.toLowerCase();
      const hasValidExtension = imageExtensions.some((ext) =>
        pathname.endsWith(ext),
      );

      return hasValidExtension;
    } catch {
      return false;
    }
  };

  const handleCustomImageUrlChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const url = e.target.value;
    setCustomImageUrl(url);
    setReplaceBgSelectedImage(null);

    if (url.trim()) {
      const isValid = validateImageUrl(url);
      if (!isValid) {
        setCustomImageUrlError(
          "Please enter a valid image URL (e.g., https://example.com/image.jpg)",
        );
      } else {
        setCustomImageUrlError(null);
      }
    } else {
      setCustomImageUrlError(null);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) return;

    try {
      // Clear previous errors
      setRemoveBgError(null);
      setTaskProgress({
        status: TaskStatus.PENDING,
        progress: 0,
      });

      const sessionToken = await app.idToken();

      const newTask: NewTask<RemoveBackgroundTaskInput> = {
        type: TaskType.REMOVE_BACKGROUND,
        inputData: {
          sourceImage: uploadedImage.originalUrl,
          imageSourceType: ImageSourceType.URL,
          edgeThreshold: 50, // Default value (edge refinement not user-configurable)
          detailPreservation,
          enhancedHairDetection: hairDetection,
        },
      };

      const response = await removeBackgroundTask<RemoveBackgroundTaskInput>(
        sessionToken,
        newTask,
      );
      const task = response.data.data;
      if (!task) {
        const errorMessage = "Something went wrong, please try again";
        setRemoveBgError(errorMessage);
        setTaskProgress(null);
        return;
      }

      const websocket = new WebSocketClient(task.userId);
      websocket.on<TaskProgress>("task-progress-" + task.id, (data) => {
        console.log("WebSocket data received:", data);
        setTaskProgress(data);
        if (data.status === TaskStatus.SUCCEEDED) {
          setRemovedBgImage(data.resultData?.outputImageUrl || null);
        } else if (data.status === TaskStatus.FAILED) {
          const errorMessage = "Failed to remove background";
          setRemoveBgError(errorMessage);
          setTaskProgress(null);
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data.message
          : "Failed to remove background. Please try again.";
      setRemoveBgError(errorMessage);
      setTaskProgress(null);
    }
  };

  const getBackgroundSourceValue = () => ({
    [BackgroundSourceType.COLOR]: replaceBgSelectedColor,
    [BackgroundSourceType.IMAGE]: replaceBgSelectedImage ?? customImageUrl,
    [BackgroundSourceType.PROMPT]: backgroundPrompt,
  });

  const handleReplaceBackground = async () => {
    const sourceImageUrl = removedBgImage || uploadedImage?.originalUrl;
    if (!sourceImageUrl) return;

    try {
      // Clear previous errors
      setReplaceBgError(null);
      setTaskProgress({
        status: TaskStatus.PENDING,
        progress: 0,
      });
      const sessionToken = await app.idToken();

      const newTask: NewTask<ReplaceBackgroundTaskInput> = {
        type: TaskType.REPLACE_BACKGROUND,
        inputData: {
          sourceImageUrl,
          backgroundImageSourceType: ImageSourceType.URL,
          backgroundSourceType: backgroundType,
          backgroundSourceValue: getBackgroundSourceValue()[backgroundType]!,
          isBackgroundRemoved: !!removedBgImage,
        },
      };

      const response = await removeBackgroundTask<ReplaceBackgroundTaskInput>(
        sessionToken,
        newTask,
      );
      const task = response.data.data;
      if (!task) {
        const errorMessage = "Something went wrong, please try again";
        setReplaceBgError(errorMessage);
        setTaskProgress(null);
        return;
      }
      const websocket = new WebSocketClient(task.userId);
      websocket.on<TaskProgress>("task-progress-" + task.id, (data) => {
        console.log("WebSocket data received:", data);
        setTaskProgress(data);
        if (data.status === TaskStatus.SUCCEEDED) {
          setActiveTab("result");
          setFinalImage(data.resultData?.outputImageUrl || null);
        } else if (data.status === TaskStatus.FAILED) {
          const errorMessage = "Failed to replace background";
          setReplaceBgError(errorMessage);
          setTaskProgress(null);
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data.message
          : "Failed to replace background. Please try again.";
      setReplaceBgError(errorMessage);
      setTaskProgress(null);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setRemovedBgImage(null);
    setFinalImage(null);
    setActiveTab("upload");
    setReplaceBgSelectedColor("#FFFFFF");
    setCustomColor("");
    setReplaceBgSelectedImage(null);
    setCustomImageUrl("");
    setBackgroundPrompt("");
    setRemoveBgError(null);
    setReplaceBgError(null);
    setCustomImageUrlError(null);
    setTaskProgress(null);
  };

  const getImageUrl = (url: string) => {
    // If it's already a data URL or external URL, return as is
    if (url.startsWith("data:") || url.startsWith("http")) {
      return url;
    }
    // Otherwise, proxy through image proxy
    return `${process.env.NEXT_PUBLIC_IMAGE_PROXY_URL}/images?url=${encodeURIComponent(url)}`;
  };

  const getBackgroundPreviewStyle = () => {
    if (backgroundType === BackgroundSourceType.COLOR) {
      const color = customColor || replaceBgSelectedColor;
      return {
        backgroundColor: color === "transparent" ? "transparent" : color,
      };
    } else if (
      backgroundType === BackgroundSourceType.IMAGE &&
      (replaceBgSelectedImage || customImageUrl)
    ) {
      const imageUrl = replaceBgSelectedImage
        ? `${process.env.NEXT_PUBLIC_IMAGE_PROXY_URL}/images?url=${encodeURIComponent(replaceBgSelectedImage)}`
        : customImageUrl;
      console.log(imageUrl);
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else {
      // Default or prompt (which would be generated)
      return { backgroundColor: "#F0F0F0" };
    }
  };

  const isTaskProcessing = taskProgress
    ? [TaskStatus.PROCESSING, TaskStatus.PENDING, TaskStatus.QUEUED].includes(
        taskProgress?.status,
      )
    : false;

  const hasErrors = !!(removeBgError || replaceBgError || customImageUrlError);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Remove Background
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Remove backgrounds and replace them with colors, images, or
              AI-generated scenes
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-4">
            <TabsTrigger value="upload" disabled={isTaskProcessing}>
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              disabled={!uploadedImage || (isTaskProcessing && !hasErrors)}
            >
              Remove
            </TabsTrigger>
            <TabsTrigger
              value="replace"
              disabled={!uploadedImage || (isTaskProcessing && !hasErrors)}
            >
              Replace
            </TabsTrigger>
            <TabsTrigger
              value="result"
              disabled={!finalImage && !isTaskProcessing}
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
                    Select Or Upload Your Image
                  </h2>
                  <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center justify-center">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <div className="flex">
                          <button
                            onClick={() => setUploadImageTab("new")}
                            className={cn(
                              "px-4 py-2 rounded-md text-sm font-medium transition-all",
                              uploadImageTab === "new"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                            )}
                          >
                            Upload New
                          </button>
                          <button
                            onClick={() => setUploadImageTab("gallery")}
                            className={cn(
                              "px-4 py-2 rounded-md text-sm font-medium transition-all",
                              uploadImageTab === "gallery"
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                            )}
                          >
                            Choose from Gallery
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Upload Mode */}
                    {uploadImageTab === "new" && (
                      <div className="h-56">
                        <ImageUploader
                          onUploaded={(imageInfo) => {
                            setUploadedImage({
                              previewUrl: imageInfo.previewImageUrl,
                              originalUrl: imageInfo.uploadLocation,
                            });
                            setActiveTab("remove");
                          }}
                          hideImagePreviewAfterUpload
                        />
                      </div>
                    )}

                    {/* Gallery Mode */}
                    {uploadImageTab === "gallery" && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">
                            Select from Gallery
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Choose from your previously uploaded images
                          </p>
                        </div>

                        <div className=" p-1 text-center">
                          <Button
                            onClick={() => {
                              setOpenImageUploadDialog(true);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Open Image Gallery
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {openImageUploadDialog && (
                    <ImageUploadDialog
                      imageSelectionLimit={1}
                      onClose={() => setOpenImageUploadDialog(false)}
                      onImagesSelected={(images) => {
                        setUploadedImage({
                          previewUrl: images[0].url,
                          originalUrl: images[0].originalUrl,
                        });
                        setActiveTab("remove");
                      }}
                      hideUploadButton
                    />
                  )}
                  {/* <div className="space-y-4">
                    {openImageUploadDialog && (
                      <ImageUploadDialog
                        imageSelectionLimit={1}
                        onClose={() => setOpenImageUploadDialog(false)}
                        onImagesSelected={(images) => {
                          setUploadedImage({
                            previewUrl: images[0].url,
                            originalUrl: images[0].originalUrl,
                          });
                          setActiveTab("remove");
                        }}
                      />
                    )}
                    <div
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => setOpenImageUploadDialog(true)}
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
                          <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Open Image Uploader
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            PNG, JPG or WEBP (max. 10MB)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                            Tips for best results
                          </h3>
                          <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                            <li>Use high-quality images with good lighting</li>
                            <li>
                              Ensure the subject has clear edges against the
                              background
                            </li>
                            <li>
                              For hair and fur, use images with contrasting
                              backgrounds
                            </li>
                            <li>
                              Avoid images with motion blur or very complex
                              backgrounds
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div> */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg mt-4">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                          Tips for best results
                        </h3>
                        <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                          <li>Use high-quality images with good lighting</li>
                          <li>
                            Ensure the subject has clear edges against the
                            background
                          </li>
                          <li>
                            For hair and fur, use images with contrasting
                            backgrounds
                          </li>
                          <li>
                            Avoid images with motion blur or very complex
                            backgrounds
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
                    title="Portrait"
                    description="Perfect edge detection even with complex hair details and transparent background replacement."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                  />
                  <ExampleCard
                    title="Product"
                    description="Clean extraction of product with preservation of shadows and transparent elements."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Remove Background Tab */}
          <TabsContent value="remove" className="space-y-4">
            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                              Tips for best results
                            </h3>
                            <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                              <li>
                                Use high-quality images with good lighting
                              </li>
                              <li>
                                Ensure clear contrast between subject and
                                background
                              </li>
                              <li>
                                For hair and fur details, choose images with
                                simple backgrounds
                              </li>
                              <li>
                                Avoid images with motion blur or complex
                                patterns
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-4">
                          {!removedBgImage && (
                            <Button
                              onClick={handleRemoveBackground}
                              className="flex-1 min-w-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                              size="lg"
                              disabled={isTaskProcessing}
                            >
                              {isTaskProcessing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span className="truncate">
                                    {taskProgress &&
                                      TaskStatusMessageMapping[
                                        taskProgress.status
                                      ]}
                                  </span>
                                </>
                              ) : removeBgError ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  <span className="truncate">Retry Remove</span>
                                </>
                              ) : (
                                <>
                                  <Eraser className="mr-2 h-4 w-4" />
                                  <span className="truncate">
                                    Remove Background
                                  </span>
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            onClick={() => setActiveTab("replace")}
                            className="flex-1 min-w-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            size="lg"
                          >
                            <Palette className="mr-2 h-4 w-4" />
                            <span className="truncate">Go to Replace</span>
                          </Button>
                        </div>

                        {removeBgError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {removeBgError}
                            </p>
                          </div>
                        )}
                      </div>
                      {removedBgImage && (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                Background removed successfully!
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={() => setActiveTab("replace")}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            size="lg"
                          >
                            <Palette className="mr-2 h-4 w-4" />
                            Go to Replace Background
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 pt-2">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      {removedBgImage
                        ? "Background Removal Result"
                        : "Your Image"}
                    </h2>

                    {!removedBgImage ? (
                      <>
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 ml-8 mr-8">
                          <Image
                            src={
                              uploadedImage.originalUrl || "/placeholder.svg"
                            }
                            alt="Uploaded image"
                            className="w-full h-auto object-contain"
                            width={300}
                            height={200}
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
                            What happens next?
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            You can either remove the background first to see
                            the extracted subject, or go directly to replace the
                            background with a color, image, or AI-generated
                            scene of your choice.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                              Original
                            </p>
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                              <Image
                                src={
                                  uploadedImage.originalUrl ||
                                  "/placeholder.svg"
                                }
                                alt="Original image"
                                className="w-full h-auto object-contain"
                                width={500}
                                height={500}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                              Background Removed
                            </p>
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==')]">
                              <EnhancedImage
                                src={removedBgImage}
                                alt="Background removed"
                                width={500}
                                height={500}
                                className="w-full h-auto object-contain"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                          <h3 className="font-medium text-sm mb-2">
                            Ready for the next step
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Your background has been successfully removed. Now
                            you can replace it with a color, image, or
                            AI-generated background.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Replace Background Tab */}
          <TabsContent value="replace" className="space-y-4">
            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Replace Background
                    </h2>

                    <div className="space-y-6">
                      <RadioGroup
                        value={backgroundType}
                        onValueChange={(value) =>
                          setBackgroundType(value as BackgroundSourceType)
                        }
                        className="grid grid-cols-3 gap-2"
                      >
                        <div>
                          <RadioGroupItem
                            value={BackgroundSourceType.COLOR}
                            id="color"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="color"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600"
                          >
                            <Palette className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Color</span>
                          </Label>
                        </div>

                        <div>
                          <RadioGroupItem
                            value={BackgroundSourceType.IMAGE}
                            id="image"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="image"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600"
                          >
                            <ImageIcon className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Image</span>
                          </Label>
                        </div>

                        <div>
                          <RadioGroupItem
                            value={BackgroundSourceType.PROMPT}
                            id="prompt"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="prompt"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600"
                          >
                            <Sparkles className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">
                              AI Prompt
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Color Background Options */}
                      {backgroundType === BackgroundSourceType.COLOR && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-2">
                            {backgroundColors.map((color) => (
                              <TooltipProvider key={color.value}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "h-10 rounded-md cursor-pointer border-2 transition-all",
                                        replaceBgSelectedColor === color.value
                                          ? "border-purple-600 scale-110"
                                          : "border-transparent hover:border-slate-300",
                                      )}
                                      style={{
                                        backgroundColor:
                                          color.value === "transparent"
                                            ? "transparent"
                                            : color.value,
                                        backgroundImage:
                                          color.value === "transparent"
                                            ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                            : undefined,
                                        backgroundSize:
                                          color.value === "transparent"
                                            ? "10px 10px"
                                            : undefined,
                                        backgroundPosition:
                                          color.value === "transparent"
                                            ? "0 0, 0 5px, 5px -5px, -5px 0"
                                            : undefined,
                                      }}
                                      onClick={() => {
                                        setReplaceBgSelectedColor(color.value);
                                        setCustomColor("");
                                      }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{color.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <CustomColorPicker
                              selectedColor={
                                customColor || replaceBgSelectedColor
                              }
                              onColorSelect={(color) => {
                                setReplaceBgSelectedColor(color);
                                setCustomColor(color);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Image Background Options */}
                      {backgroundType === BackgroundSourceType.IMAGE && (
                        <div className="space-y-4">
                          {/* {backgroundImages.map((image) => (
                              <div
                                key={image.name}
                                className={cn(
                                  "h-20 rounded-md cursor-pointer border-2 transition-all overflow-hidden",
                                  replaceBgSelectedImage === image.url
                                    ? "border-purple-600 scale-105"
                                    : "border-transparent hover:border-slate-300",
                                )}
                                onClick={() => {
                                  setReplaceBgSelectedImage(image.url);
                                  setCustomImageUrl("");
                                }}
                                title={image.name}
                              >
                                <EnhancedImage
                                  src={image.thumbnail || "/placeholder.svg"}
                                  alt={image.name}
                                  className="w-full h-full object-cover"
                                  width={500}
                                  height={500}
                                />
                              </div>
                            ))} */}
                          <div className="relative">
                            <Button
                              onClick={() =>
                                setShowImageGallery(!showImageGallery)
                              }
                              variant="outline"
                              className="flex items-center space-x-2 w-full"
                            >
                              <span>Image Gallery</span>
                              {showImageGallery ? (
                                <ChevronUp />
                              ) : (
                                <ChevronDown />
                              )}
                            </Button>
                            {showImageGallery && (
                              <ImageGallery
                                hideUploadButton
                                hideActions
                                hideCancelButton
                                maxColumns={3}
                                maxRows={2}
                                imageSelectionLimit={1}
                                onSelected={(images) => {
                                  console.log(images);
                                  setReplaceBgSelectedImage(images[0].url);
                                  setCustomImageUrl("");
                                }}
                              />
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="custom-image-url">
                              Custom Image URL
                            </Label>
                            <Input
                              id="custom-image-url"
                              type="text"
                              placeholder="https://example.com/image.jpg"
                              value={customImageUrl}
                              onChange={handleCustomImageUrlChange}
                            />
                            {customImageUrlError && (
                              <p className="text-xs text-red-500 mt-1">
                                {customImageUrlError}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Upload Custom Image</Label>
                            <ImageUploader
                              onUploaded={(imageInfo) => {
                                setReplaceBgSelectedImage(
                                  imageInfo.uploadLocation,
                                );
                                setCustomImageUrl("");
                              }}
                              hideImagePreviewAfterUpload
                            />
                          </div>
                        </div>
                      )}

                      {/* Prompt Background Options */}
                      {backgroundType === BackgroundSourceType.PROMPT && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="background-prompt">
                              Describe the background you want
                            </Label>
                            <Textarea
                              id="background-prompt"
                              placeholder="E.g., Studio with soft lighting and neutral backdrop"
                              value={backgroundPrompt}
                              onChange={(e) =>
                                setBackgroundPrompt(e.target.value)
                              }
                              className="min-h-[100px] resize-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Suggested Prompts</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {backgroundPrompts.map((prompt, index) => (
                                <div
                                  key={index}
                                  className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm"
                                  onClick={() => setBackgroundPrompt(prompt)}
                                >
                                  {prompt}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                                  AI Background Tips
                                </h3>
                                <ul className="text-xs text-amber-700 dark:text-amber-400 mt-1 space-y-1 list-disc pl-4">
                                  <li>
                                    Be specific about lighting, colors, and
                                    style
                                  </li>
                                  <li>
                                    Mention if you want the background to match
                                    the subject
                                  </li>
                                  <li>
                                    Describe the mood or atmosphere you want to
                                    create
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <Button
                          onClick={handleReplaceBackground}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          size="lg"
                          disabled={
                            isTaskProcessing ||
                            (backgroundType === BackgroundSourceType.PROMPT &&
                              !backgroundPrompt) ||
                            (backgroundType === BackgroundSourceType.IMAGE &&
                              !!customImageUrlError)
                          }
                        >
                          {isTaskProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {taskProgress &&
                                TaskStatusMessageMapping[taskProgress.status]}
                            </>
                          ) : replaceBgError ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry Replace Background
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Replace Background
                            </>
                          )}
                        </Button>

                        {replaceBgError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {replaceBgError}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Preview
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Original
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <EnhancedImage
                              src={
                                uploadedImage?.previewUrl || "/placeholder.svg"
                              }
                              alt="Original image"
                              className="w-full h-auto object-contain"
                              width={500}
                              height={500}
                            />
                          </div>
                        </div>
                        {removedBgImage ? (
                          <div>
                            <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                              Background Removed
                            </p>
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==')]">
                              <EnhancedImage
                                src={removedBgImage || "/placeholder.svg"}
                                alt="Background removed"
                                width={500}
                                height={500}
                                className="w-full h-auto object-contain"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                              Background Preview
                            </p>
                            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-[250px] relative">
                              {backgroundType ===
                                BackgroundSourceType.COLOR && (
                                <div
                                  className="w-full h-full"
                                  style={{
                                    backgroundColor:
                                      customColor || replaceBgSelectedColor,
                                    backgroundImage:
                                      (customColor ||
                                        replaceBgSelectedColor) ===
                                      "transparent"
                                        ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                        : undefined,
                                    backgroundSize:
                                      (customColor ||
                                        replaceBgSelectedColor) ===
                                      "transparent"
                                        ? "10px 10px"
                                        : undefined,
                                    backgroundPosition:
                                      (customColor ||
                                        replaceBgSelectedColor) ===
                                      "transparent"
                                        ? "0 0, 0 5px, 5px -5px, -5px 0"
                                        : undefined,
                                  }}
                                />
                              )}
                              {backgroundType === BackgroundSourceType.IMAGE &&
                                (replaceBgSelectedImage || customImageUrl) && (
                                  <Image
                                    src={
                                      replaceBgSelectedImage
                                        ? getImageUrl(replaceBgSelectedImage)
                                        : customImageUrl || "/placeholder.svg"
                                    }
                                    alt="Background preview"
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      console.error("Image failed to load:", e);
                                    }}
                                    onLoad={() => {
                                      console.log("Image loaded successfully");
                                    }}
                                  />
                                )}
                              {backgroundType === BackgroundSourceType.IMAGE &&
                                !replaceBgSelectedImage &&
                                !customImageUrl && (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      Select an image or enter a URL
                                    </p>
                                  </div>
                                )}
                              {backgroundType === BackgroundSourceType.PROMPT &&
                                !finalImage && (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 pl-4">
                                      {backgroundPrompt
                                        ? "AI will generate this background after processing"
                                        : "Enter a prompt to generate a background"}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>

                      {removedBgImage && (
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Background Preview
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-[500px] relative">
                            {(() => {
                              console.log("Background preview debug:", {
                                backgroundType,
                                replaceBgSelectedImage,
                                customImageUrl,
                                hasImage: !!(
                                  replaceBgSelectedImage || customImageUrl
                                ),
                              });
                              return null;
                            })()}
                            {backgroundType === BackgroundSourceType.COLOR && (
                              <div
                                className="w-full h-full"
                                style={{
                                  backgroundColor:
                                    customColor || replaceBgSelectedColor,
                                  backgroundImage:
                                    (customColor || replaceBgSelectedColor) ===
                                    "transparent"
                                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                      : undefined,
                                  backgroundSize:
                                    (customColor || replaceBgSelectedColor) ===
                                    "transparent"
                                      ? "10px 10px"
                                      : undefined,
                                  backgroundPosition:
                                    (customColor || replaceBgSelectedColor) ===
                                    "transparent"
                                      ? "0 0, 0 5px, 5px -5px, -5px 0"
                                      : undefined,
                                }}
                              />
                            )}
                            {backgroundType === BackgroundSourceType.IMAGE &&
                              (replaceBgSelectedImage || customImageUrl) && (
                                <Image
                                  src={
                                    replaceBgSelectedImage
                                      ? getImageUrl(replaceBgSelectedImage)
                                      : customImageUrl || "/placeholder.svg"
                                  }
                                  alt="Background preview"
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    console.error("Image failed to load:", e);
                                  }}
                                  onLoad={() => {
                                    console.log("Image loaded successfully");
                                  }}
                                />
                              )}
                            {backgroundType === BackgroundSourceType.IMAGE &&
                              !replaceBgSelectedImage &&
                              !customImageUrl && (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Select an image or enter a URL
                                  </p>
                                </div>
                              )}
                            {backgroundType === BackgroundSourceType.PROMPT &&
                              !finalImage && (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {backgroundPrompt
                                      ? "AI will generate this background after processing"
                                      : "Enter a prompt to generate a background"}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
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
              <Card className="w-full max-w-2xl mx-auto overflow-hidden">
                <CardContent className="p-6">
                  {isTaskProcessing ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px]">
                      <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                      <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                        Finalizing your image...
                      </p>
                      <p className="text-sm text-center text-slate-500 dark:text-slate-500 mt-2 max-w-md">
                        {backgroundType === BackgroundSourceType.COLOR &&
                          "Applying solid color background"}
                        {backgroundType === BackgroundSourceType.IMAGE &&
                          "Compositing with background image"}
                        {backgroundType === BackgroundSourceType.PROMPT &&
                          "Generating AI background based on your prompt"}
                      </p>
                    </div>
                  ) : finalImage ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Original
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <EnhancedImage
                              src={uploadedImage?.originalUrl!}
                              alt="Original image"
                              className="w-full h-auto object-contain"
                              width={500}
                              height={500}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Final Result
                          </p>
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <EnhancedImage
                              src={finalImage}
                              alt="Final result"
                              className="w-full h-auto object-contain"
                              width={500}
                              height={500}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-2">
                          Processing Details
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Background Type:
                            </span>
                            <span className="font-medium capitalize">
                              {backgroundType}
                            </span>
                          </div>
                          {backgroundType === BackgroundSourceType.COLOR && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400">
                                Color:
                              </span>
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full mr-1"
                                  style={{
                                    backgroundColor:
                                      customColor || replaceBgSelectedColor,
                                  }}
                                />
                                <span className="font-medium">
                                  {customColor || replaceBgSelectedColor}
                                </span>
                              </div>
                            </div>
                          )}
                          {backgroundType === BackgroundSourceType.PROMPT && (
                            <div className="flex justify-between col-span-2">
                              <span className="text-slate-500 dark:text-slate-400">
                                Prompt:
                              </span>
                              <span className="font-medium text-right max-w-[70%]">
                                {backgroundPrompt}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Detail Preservation:
                            </span>
                            <span className="font-medium flex items-center">
                              {detailPreservation ? (
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
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          onClick={() => setActiveTab("replace")}
                          variant="outline"
                          className="flex-1"
                        >
                          Try Different Background
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

        {/* How It Works Section */}
        <section className="mt-16 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">1. Upload</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Upload any image with a subject you want to extract
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Eraser className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">2. Remove</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Our AI precisely removes the background, preserving fine
                  details
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Palette className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">3. Replace</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Choose a new background: color, image, or AI-generated scene
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">4. Download</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Get your professionally edited image ready for use
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
