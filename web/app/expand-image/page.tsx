"use client";

import type React from "react";

import { useState, useRef } from "react";
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
  Move,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

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

// Expansion directions
const expansionDirections = [
  { id: "all", label: "All Sides", icon: Move },
  { id: "horizontal", label: "Horizontal", icon: MoveHorizontal },
  { id: "vertical", label: "Vertical", icon: MoveVertical },
  { id: "top", label: "Top", icon: ArrowUp },
  { id: "right", label: "Right", icon: ArrowRight },
  { id: "bottom", label: "Bottom", icon: ArrowDown },
  { id: "left", label: "Left", icon: ArrowLeftIcon },
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [targetDimensions, setTargetDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [expansionDirection, setExpansionDirection] = useState("all");
  const [expansionAmount, setExpansionAmount] = useState(50);
  const [fillStyle, setFillStyle] = useState("seamless");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [contentPrompt, setContentPrompt] = useState("");
  const [preserveSubjects, setPreserveSubjects] = useState(true);
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [matchLighting, setMatchLighting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event && event.target) {
          const result = event.target.result as string;
          setUploadedImage(result);

          // Get image dimensions
          const img = new Image();
          img.onload = () => {
            const width = img.width;
            const height = img.height;

            setOriginalDimensions({ width, height });

            // Set initial target dimensions with 50% expansion
            const expandedWidth = Math.round(width * 1.5);
            const expandedHeight = Math.round(height * 1.5);
            setTargetDimensions({
              width: expandedWidth,
              height: expandedHeight,
            });
          };
          img.src = result;

          setActiveTab("expand");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExpansionDirectionChange = (direction: string) => {
    setExpansionDirection(direction);

    // Update target dimensions based on direction and amount
    const expansionFactor = 1 + expansionAmount / 100;
    let newWidth = originalDimensions.width;
    let newHeight = originalDimensions.height;

    if (
      direction === "all" ||
      direction === "horizontal" ||
      direction === "right" ||
      direction === "left"
    ) {
      newWidth = Math.round(originalDimensions.width * expansionFactor);
    }

    if (
      direction === "all" ||
      direction === "vertical" ||
      direction === "top" ||
      direction === "bottom"
    ) {
      newHeight = Math.round(originalDimensions.height * expansionFactor);
    }

    setTargetDimensions({ width: newWidth, height: newHeight });
  };

  const handleExpansionAmountChange = (value: number) => {
    setExpansionAmount(value);

    // Update target dimensions based on direction and new amount
    const expansionFactor = 1 + value / 100;
    let newWidth = originalDimensions.width;
    let newHeight = originalDimensions.height;

    if (
      expansionDirection === "all" ||
      expansionDirection === "horizontal" ||
      expansionDirection === "right" ||
      expansionDirection === "left"
    ) {
      newWidth = Math.round(originalDimensions.width * expansionFactor);
    }

    if (
      expansionDirection === "all" ||
      expansionDirection === "vertical" ||
      expansionDirection === "top" ||
      expansionDirection === "bottom"
    ) {
      newHeight = Math.round(originalDimensions.height * expansionFactor);
    }

    setTargetDimensions({ width: newWidth, height: newHeight });
  };

  const handleExpandImage = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // In a real app, you would call your AI service here
    // For demo purposes, we'll use a placeholder image
    setExpandedImage(
      "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=1200&width=1600",
    );
    setIsProcessing(false);
    setActiveTab("result");
  };

  const handleReset = () => {
    setUploadedImage(null);
    setExpandedImage(null);
    setActiveTab("upload");
    setExpansionDirection("all");
    setExpansionAmount(50);
    setFillStyle("seamless");
    setBackgroundColor("#FFFFFF");
    setContentPrompt("");
    setPreserveSubjects(true);
    setEnhanceQuality(true);
    setMatchLighting(true);
    setOriginalDimensions({ width: 0, height: 0 });
    setTargetDimensions({ width: 0, height: 0 });
  };

  const calculateExpansionPercentage = () => {
    if (originalDimensions.width === 0) return "0%";

    const originalArea = originalDimensions.width * originalDimensions.height;
    const newArea = targetDimensions.width * targetDimensions.height;
    const percentage = Math.round((newArea / originalArea - 1) * 100);

    return `${percentage}%`;
  };

  // Preview of how the expansion will look
  const getExpansionPreview = () => {
    if (!originalDimensions.width) return {};

    const originalWidth = originalDimensions.width;
    const originalHeight = originalDimensions.height;
    const targetWidth = targetDimensions.width;
    const targetHeight = targetDimensions.height;

    // Calculate the position of the original image within the expanded canvas
    let left = "50%";
    let top = "50%";
    let width = "100%";
    let height = "100%";
    let transform = "translate(-50%, -50%)";

    if (expansionDirection === "right") {
      left = "0";
      transform = "none";
      width = `${(originalWidth / targetWidth) * 100}%`;
    } else if (expansionDirection === "left") {
      left = "100%";
      transform = "translateX(-100%)";
      width = `${(originalWidth / targetWidth) * 100}%`;
    } else if (expansionDirection === "bottom") {
      top = "0";
      transform = "none";
      height = `${(originalHeight / targetHeight) * 100}%`;
    } else if (expansionDirection === "top") {
      top = "100%";
      transform = "translateY(-100%)";
      height = `${(originalHeight / targetHeight) * 100}%`;
    } else if (expansionDirection === "horizontal") {
      top = "50%";
      transform = "translateY(-50%)";
      width = `${(originalWidth / targetWidth) * 100}%`;
      height = "100%";
    } else if (expansionDirection === "vertical") {
      left = "50%";
      transform = "translateX(-50%)";
      width = "100%";
      height = `${(originalHeight / targetHeight) * 100}%`;
    } else {
      // "all" direction
      width = `${(originalWidth / targetWidth) * 100}%`;
      height = `${(originalHeight / targetHeight) * 100}%`;
    }

    return {
      position: "absolute",
      left,
      top,
      width,
      height,
      transform,
      border: "1px dashed rgba(255, 255, 255, 0.5)",
    };
  };

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
              disabled={!uploadedImage || isProcessing}
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
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                    Upload Your Image
                  </h2>
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
                          <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            Click to upload or drag and drop
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
                            <li>
                              Use images with clear edges and well-defined
                              subjects
                            </li>
                            <li>
                              Images with simple or gradient backgrounds work
                              best
                            </li>
                            <li>
                              Avoid images with text that needs to be preserved
                              at the edges
                            </li>
                            <li>
                              For landscape expansion, choose images with
                              natural horizons
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
                    title="Portrait to Landscape"
                    description="Convert portrait photos to landscape format with seamless content extension."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=200"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=500"
                  />
                  <ExampleCard
                    title="Social Media Adaptation"
                    description="Expand images to fit different social media aspect ratios without cropping."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=600"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Expand Tab */}
          <TabsContent value="expand" className="space-y-4">
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
                      Expansion Settings
                    </h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Expansion Direction</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {expansionDirections.map((direction) => {
                            const Icon = direction.icon;
                            return (
                              <Button
                                key={direction.id}
                                type="button"
                                variant={
                                  expansionDirection === direction.id
                                    ? "default"
                                    : "outline"
                                }
                                className={cn(
                                  "flex flex-col py-3 h-auto",
                                  expansionDirection === direction.id &&
                                    "bg-purple-600 hover:bg-purple-700",
                                )}
                                onClick={() =>
                                  handleExpansionDirectionChange(direction.id)
                                }
                              >
                                <Icon className="h-5 w-5 mb-1" />
                                <span className="text-xs">
                                  {direction.label}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="expansion-amount">
                            Expansion Amount
                          </Label>
                          <span className="text-sm text-slate-500">
                            {expansionAmount}%
                          </span>
                        </div>
                        <Slider
                          id="expansion-amount"
                          min={10}
                          max={200}
                          step={5}
                          value={[expansionAmount]}
                          onValueChange={(value) =>
                            handleExpansionAmountChange(value[0])
                          }
                          className="py-2"
                        />
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>
                            Original: {originalDimensions.width} ×{" "}
                            {originalDimensions.height}px
                          </span>
                          <span>
                            New: {targetDimensions.width} ×{" "}
                            {targetDimensions.height}px
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Content Fill Style</Label>
                        <RadioGroup
                          value={fillStyle}
                          onValueChange={setFillStyle}
                          className="space-y-2"
                        >
                          {contentFillStyles.map((style) => (
                            <div
                              key={style.id}
                              className="flex items-start space-x-2"
                            >
                              <RadioGroupItem
                                value={style.id}
                                id={style.id}
                                className="mt-1"
                              />
                              <Label
                                htmlFor={style.id}
                                className="font-normal cursor-pointer"
                              >
                                <span className="font-medium">
                                  {style.label}
                                </span>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {style.description}
                                </p>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {fillStyle === "solid-color" && (
                        <div className="space-y-2">
                          <Label htmlFor="background-color">
                            Background Color
                          </Label>
                          <div className="flex space-x-2">
                            <div
                              className="h-10 w-10 rounded-md border"
                              style={{ backgroundColor: backgroundColor }}
                            />
                            <Input
                              id="background-color"
                              type="text"
                              placeholder="#RRGGBB"
                              value={backgroundColor}
                              onChange={(e) =>
                                setBackgroundColor(e.target.value)
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      )}

                      {fillStyle === "prompt" && (
                        <div className="space-y-2">
                          <Label htmlFor="content-prompt">
                            Content Generation Prompt
                          </Label>
                          <Textarea
                            id="content-prompt"
                            placeholder="Describe what content should be generated in the expanded areas..."
                            value={contentPrompt}
                            onChange={(e) => setContentPrompt(e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Be specific about style, colors, and elements to
                            match the original image
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label
                            htmlFor="preserve-subjects"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Preserve Subjects
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Maintain integrity of main subjects during expansion
                          </p>
                        </div>
                        <Switch
                          id="preserve-subjects"
                          checked={preserveSubjects}
                          onCheckedChange={setPreserveSubjects}
                          className="data-[state=checked]:bg-purple-600"
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
                            Improve overall image quality during expansion
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
                            htmlFor="match-lighting"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Match Lighting
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Ensure consistent lighting in expanded areas
                          </p>
                        </div>
                        <Switch
                          id="match-lighting"
                          checked={matchLighting}
                          onCheckedChange={setMatchLighting}
                          className="data-[state=checked]:bg-purple-600"
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
                            Expand Image
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
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded image"
                          className="w-full h-auto object-contain"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                          <Button
                            // variant="secondary"
                            size="icon"
                            onClick={handleReset}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative">
                        <div
                          className="w-full"
                          style={{
                            paddingTop: `${(targetDimensions.height / targetDimensions.width) * 100}%`,
                            backgroundColor:
                              fillStyle === "solid-color"
                                ? backgroundColor
                                : "transparent",
                          }}
                        >
                          {uploadedImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div
                                className="relative"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  opacity: 0.7,
                                }}
                              >
                                <div
                                  style={
                                    getExpansionPreview() as React.CSSProperties
                                  }
                                >
                                  <div className="w-full h-full bg-purple-500 bg-opacity-30 rounded-sm"></div>
                                </div>
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
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Direction:
                            </span>
                            <span className="font-medium capitalize">
                              {
                                expansionDirections.find(
                                  (d) => d.id === expansionDirection,
                                )?.label
                              }
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
                              Fill Style:
                            </span>
                            <span className="font-medium">
                              {
                                contentFillStyles.find(
                                  (s) => s.id === fillStyle,
                                )?.label
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
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
                  ) : expandedImage ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                            Original
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                            <img
                              src={uploadedImage || "/placeholder.svg"}
                              alt="Original image"
                              className="w-full h-auto object-contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="secondary" size="sm">
                                      {originalDimensions.width} ×{" "}
                                      {originalDimensions.height}px
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Original dimensions</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-center font-medium text-slate-500 dark:text-slate-400">
                            Expanded
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                            <img
                              src={expandedImage || "/placeholder.svg"}
                              alt="Expanded image"
                              className="w-full h-auto object-contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="secondary" size="sm">
                                        {targetDimensions.width} ×{" "}
                                        {targetDimensions.height}px
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>New dimensions</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="secondary" size="icon">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download expanded image</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <h3 className="font-medium text-sm mb-2">
                          Expansion Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
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
                              {
                                expansionDirections.find(
                                  (d) => d.id === expansionDirection,
                                )?.label
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Fill Style:
                            </span>
                            <span className="font-medium">
                              {
                                contentFillStyles.find(
                                  (s) => s.id === fillStyle,
                                )?.label
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Quality Enhancement:
                            </span>
                            <span className="font-medium flex items-center">
                              {enhanceQuality ? (
                                <>
                                  <Check className="h-3 w-3 text-green-500 mr-1" />
                                  Yes
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 text-red-500 mr-1" />
                                  No
                                </>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Subject Preservation:
                            </span>
                            <span className="font-medium flex items-center">
                              {preserveSubjects ? (
                                <>
                                  <Check className="h-3 w-3 text-green-500 mr-1" />
                                  Yes
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 text-red-500 mr-1" />
                                  No
                                </>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Lighting Match:
                            </span>
                            <span className="font-medium flex items-center">
                              {matchLighting ? (
                                <>
                                  <Check className="h-3 w-3 text-green-500 mr-1" />
                                  Yes
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 text-red-500 mr-1" />
                                  No
                                </>
                              )}
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
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="flex-1"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          New Image
                        </Button>
                        <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                          <Download className="mr-2 h-4 w-4" />
                          Download
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
