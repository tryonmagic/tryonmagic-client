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
import ImageUploadDialog from "@/lib/uploader/components/image-upload-manager";
import {
  ImageSourceType,
  NewTask,
  RemoveBackgroundTaskInput,
  TaskProgress,
  TaskStatus,
  TaskStatusMessageMapping,
  TaskType,
} from "@/lib/api/type";
import { newTask as removeBackgroundTask } from "@/lib/api/tasks";
import { useAppBridge } from "@shopify/app-bridge-react";
import { WebSocketClient } from "@/socket";
import EnhancedImage from "@/components/ui/EnhanchedImage";

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
];

// Predefined background images
const backgroundImages = [
  {
    name: "Gradient 1",
    thumbnail:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    url: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
  },
  {
    name: "Gradient 2",
    thumbnail:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    url: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
  },
  {
    name: "Studio",
    thumbnail:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    url: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
  },
  {
    name: "Nature",
    thumbnail:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    url: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
  },
  {
    name: "Urban",
    thumbnail:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    url: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
  },
  {
    name: "Abstract",
    thumbnail:
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    url: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
  },
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

export default function RemoveBGPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedImage, setUploadedImage] = useState<{
    previewUrl: string;
    originalUrl: string;
  } | null>(null);
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [backgroundType, setBackgroundType] = useState<
    "color" | "image" | "prompt"
  >("color");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [customColor, setCustomColor] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [edgeRefinement, setEdgeRefinement] = useState(50);
  const [detailPreservation, setDetailPreservation] = useState(true);
  const [hairDetection, setHairDetection] = useState(true);
  const customImageInputRef = useRef<HTMLInputElement>(null);
  const [socket, setSocket] = useState<WebSocketClient | null>(null);

  const [openImageUploadDialog, setOpenImageUploadDialog] = useState(false);
  const app = useAppBridge();

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setCustomImageUrl("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) return;

    try {
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
          edgeThreshold: edgeRefinement,
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
        console.error("No task data returned");
        return;
      }
      const websocket = new WebSocketClient(task.userId);
      websocket.on<TaskProgress>("task-progress", (data) => {
        console.log("WebSocket data received:", data);
        setTaskProgress(data);
        if (data.status === TaskStatus.SUCCEEDED) {
          setActiveTab("replace");
          setRemovedBgImage(data.resultData?.outputImageUrl || null);
        }
      });
      setSocket(websocket);
    } catch (error) {
      console.error("Error removing background:", error);
      // Handle error (e.g., show a notification)
      alert("Failed to remove background. Please try again.");
    }
  };

  const handleReplaceBackground = async () => {
    if (!removedBgImage) return;

    // setIsProcessing(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app, you would call your AI service here to composite the image
    // For demo purposes, we'll use a placeholder image
    setFinalImage(
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800",
    );
    // setIsProcessing(false);
    setActiveTab("result");
  };

  const handleReset = () => {
    setUploadedImage(null);
    setRemovedBgImage(null);
    setFinalImage(null);
    setActiveTab("upload");
    setSelectedColor("#FFFFFF");
    setCustomColor("");
    setSelectedImage(null);
    setCustomImageUrl("");
    setBackgroundPrompt("");
  };

  const getBackgroundPreviewStyle = () => {
    if (backgroundType === "color") {
      const color = customColor || selectedColor;
      return {
        backgroundColor: color === "transparent" ? "transparent" : color,
      };
    } else if (
      backgroundType === "image" &&
      (selectedImage || customImageUrl)
    ) {
      const imageUrl = selectedImage || customImageUrl;
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
              Remove Background
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Remove backgrounds and replace them with colors, images, or
              AI-generated scenes
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="upload" disabled={isTaskProcessing}>
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              disabled={!uploadedImage || isTaskProcessing}
            >
              Remove
            </TabsTrigger>
            <TabsTrigger
              value="replace"
              disabled={!removedBgImage || isTaskProcessing}
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
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Adjust Settings
                    </h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="edge-refinement">
                            Edge Refinement
                          </Label>
                          <span className="text-sm text-slate-500">
                            {edgeRefinement}%
                          </span>
                        </div>
                        <Slider
                          id="edge-refinement"
                          min={0}
                          max={100}
                          step={1}
                          value={[edgeRefinement]}
                          onValueChange={(value) => setEdgeRefinement(value[0])}
                          className="py-2"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Higher values create smoother edges, lower values
                          preserve more detail
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="detail-preservation"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Detail Preservation
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Preserve fine details like hair and transparent
                            areas
                          </p>
                        </div>
                        <Switch
                          id="detail-preservation"
                          checked={detailPreservation}
                          onCheckedChange={setDetailPreservation}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="hair-detection"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Enhanced Hair Detection
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Specialized processing for hair and fur
                          </p>
                        </div>
                        <Switch
                          id="hair-detection"
                          checked={hairDetection}
                          onCheckedChange={setHairDetection}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      <Button
                        onClick={handleRemoveBackground}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                        disabled={isTaskProcessing}
                      >
                        {isTaskProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {taskProgress &&
                              TaskStatusMessageMapping[taskProgress.status]}
                          </>
                        ) : (
                          <>
                            <Eraser className="mr-2 h-4 w-4" />
                            Remove Background
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                      Your Image
                    </h2>
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Image
                        src={uploadedImage.originalUrl || "/placeholder.svg"}
                        alt="Uploaded image"
                        className="w-full h-auto object-contain"
                        width={500}
                        height={500}
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
                        Our AI will analyze your image and remove the
                        background. You'll then be able to replace it with a
                        color, image, or AI-generated background of your choice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Replace Background Tab */}
          <TabsContent value="replace" className="space-y-4">
            {removedBgImage && (
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
                          setBackgroundType(
                            value as "color" | "image" | "prompt",
                          )
                        }
                        className="grid grid-cols-3 gap-2"
                      >
                        <div>
                          <RadioGroupItem
                            value="color"
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
                            value="image"
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
                            value="prompt"
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
                      {backgroundType === "color" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-2">
                            {backgroundColors.map((color) => (
                              <div
                                key={color.value}
                                className={cn(
                                  "h-10 rounded-md cursor-pointer border-2 transition-all",
                                  selectedColor === color.value
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
                                  setSelectedColor(color.value);
                                  setCustomColor("");
                                }}
                                title={color.name}
                              />
                            ))}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="custom-color">Custom Color</Label>
                            <div className="flex space-x-2">
                              <div
                                className="h-10 w-10 rounded-md border"
                                style={{
                                  backgroundColor: customColor || "#FFFFFF",
                                }}
                              />
                              <Input
                                id="custom-color"
                                type="text"
                                placeholder="#RRGGBB"
                                value={customColor}
                                onChange={(e) => {
                                  setCustomColor(e.target.value);
                                  setSelectedColor("");
                                }}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Background Options */}
                      {backgroundType === "image" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            {backgroundImages.map((image) => (
                              <div
                                key={image.name}
                                className={cn(
                                  "h-20 rounded-md cursor-pointer border-2 transition-all overflow-hidden",
                                  selectedImage === image.url
                                    ? "border-purple-600 scale-105"
                                    : "border-transparent hover:border-slate-300",
                                )}
                                onClick={() => {
                                  setSelectedImage(image.url);
                                  setCustomImageUrl("");
                                }}
                                title={image.name}
                              >
                                <img
                                  src={image.thumbnail || "/placeholder.svg"}
                                  alt={image.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
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
                              onChange={(e) => {
                                setCustomImageUrl(e.target.value);
                                setSelectedImage(null);
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Upload Custom Image</Label>
                            <div
                              className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                              onClick={() =>
                                customImageInputRef.current?.click()
                              }
                            >
                              <input
                                type="file"
                                ref={customImageInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleCustomImageUpload}
                              />
                              <div className="flex items-center justify-center space-x-2">
                                <Upload className="h-4 w-4 text-slate-500" />
                                <span className="text-sm text-slate-500">
                                  Upload background image
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Prompt Background Options */}
                      {backgroundType === "prompt" && (
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

                      <Button
                        onClick={handleReplaceBackground}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                        disabled={
                          isTaskProcessing ||
                          (backgroundType === "prompt" && !backgroundPrompt)
                        }
                      >
                        {isTaskProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {taskProgress &&
                              TaskStatusMessageMapping[taskProgress.status]}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Replace Background
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
                      </div>

                      <div>
                        <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                          Background Preview
                        </p>
                        <div
                          className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-48"
                          style={getBackgroundPreviewStyle()}
                        >
                          {backgroundType === "prompt" && !finalImage && (
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
                        {backgroundType === "color" &&
                          "Applying solid color background"}
                        {backgroundType === "image" &&
                          "Compositing with background image"}
                        {backgroundType === "prompt" &&
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
                            <img
                              src={
                                uploadedImage?.previewUrl || "/placeholder.svg"
                              }
                              alt="Original image"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Final Result
                          </p>
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                              src={finalImage || "/placeholder.svg"}
                              alt="Final result"
                              className="w-full h-auto object-contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="mr-2"
                                    >
                                      <Download className="h-5 w-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Download image</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                          {backgroundType === "color" && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400">
                                Color:
                              </span>
                              <div className="flex items-center">
                                <div
                                  className="h-4 w-4 rounded-full mr-1"
                                  style={{
                                    backgroundColor:
                                      customColor || selectedColor,
                                  }}
                                />
                                <span className="font-medium">
                                  {customColor || selectedColor}
                                </span>
                              </div>
                            </div>
                          )}
                          {backgroundType === "prompt" && (
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
                              Edge Refinement:
                            </span>
                            <span className="font-medium">
                              {edgeRefinement}%
                            </span>
                          </div>
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
