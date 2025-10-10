"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Download,
  Info,
  Shirt,
  PenIcon as Pants,
  User,
  Tally2,
  Tally3,
  Tally5,
  ImageIcon,
  CheckCircle2,
  Layers,
  Settings,
  Wand2,
  ArrowRight,
  XIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, handleDownload } from "@/lib/utils";
import { FilterProvider } from "@/components/model-filters/filter-context";
import { FilterBar } from "@/components/model-filters/filter-bar";
import EnhancedImage from "@/components/ui/EnhanchedImage";
import {
  NewTask,
  OutfitType,
  TaskProgress,
  TaskStatus,
  TaskType,
  VTONModelMode,
  VTONTaskInput,
  VtonTaskResultData,
  AIModel,
} from "@/lib/api/type";
import { newTask as newVTONTask } from "@/lib/api/tasks";
import { useAppBridge } from "@shopify/app-bridge-react";
import { WebSocketClient } from "@/socket";
import { useAuthenticatedQuery } from "@/lib/hooks/useAuthenticatedQuery";
import { getAIModelsQuery } from "./queries";
import { getGarments } from "@/lib/api/ai-models";
import ImageUploader, {
  ImageInfo,
} from "@/lib/uploader/components/ImageUploader";
import {
  ImageGallery,
  ImageType,
} from "@/lib/uploader/components/image-upload-manager";
import Pagination from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImageUploadDialog from "@/lib/uploader/components/image-upload-manager";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

export default function VirtualTryOnPage() {
  const [activeTab, setActiveTab] = useState("model");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [uploadedModel, setUploadedModel] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState("all");
  const [zoom, setZoom] = useState(1);
  const appBridge = useAppBridge();
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryMode, setGalleryMode] = useState(false);
  const garmentFileInputRef = useRef<HTMLInputElement>(null);
  const [vtonError, setVtonError] = useState<string | null>(null);

  // Configuration options
  const [tryOnCategory, setTryOnCategory] = useState<OutfitType>(
    OutfitType.TOP,
  );
  const [modelMode, setModelMode] = useState<VTONModelMode>(
    VTONModelMode.BALANCED,
  );
  const [numSamples, setNumSamples] = useState(1);
  const [seed, setSeed] = useState(42);
  const [coverFeet, setCoverFeet] = useState(false);
  const [adjustHands, setAdjustHands] = useState(true);
  const [restoreBackground, setRestoreBackground] = useState(true);
  const [restoreClothes, setRestoreClothes] = useState(false);

  const [aiModelUploadedImageInfo, setAiModelUploadedImageInfo] =
    useState<ImageInfo | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const modelsPerPage = 10;

  const {
    isLoading,
    data: aiModels,
    isFetching,
  } = useAuthenticatedQuery({
    queryKey: [
      "ai-models",
      {
        page: currentPage,
        pageSize: modelsPerPage,
      },
    ],
    queryFn: getAIModelsQuery,
    placeholderData: (value) => value,
  });
  const { data: garments } = useAuthenticatedQuery({
    queryKey: ["garments"],
    queryFn: getGarments,
  });
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [modelFilter]);

  // Calculate pagination
  const totalModels = aiModels?.totalResults || 0;
  const totalPages = aiModels?.totalPages || 0;
  const currentModels = aiModels?.results ?? [];
  console.log({ aiModels });

  const handleAIModelImageUploaded = (imageInfo: ImageInfo) => {
    setAiModelUploadedImageInfo(imageInfo);
    setUploadedModel(imageInfo.previewImageUrl);
    setSelectedModel(null);
  };

  const handleGarmentImageUploaded = (imageInfo: ImageInfo) => {
    setGarmentImage(imageInfo.uploadLocation);
  };

  const handleGarmentImageSelected = (selectedImages: ImageType[]) => {
    if (selectedImages.length > 0) {
      setGarmentImage(selectedImages[0].url);
    }
    setShowImageGallery(false);
  };

  // Reset model selection
  const resetModel = () => {
    setUploadedModel(null);
    setSelectedModel(null);
  };

  // Generate random seed
  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  // Process the virtual try-on
  const processVirtualTryOn = async (defaultSeed = 42) => {
    if ((!selectedModel && !uploadedModel) || !garmentImage) {
      return;
    }

    try {
      // Clear previous errors
      setVtonError(null);

      const sessionToken = await appBridge.idToken();

      setIsProcessing(true);
      setProgress(0);
      setActiveTab("results");
      setResults([]);
      setTaskProgress({
        status: TaskStatus.PENDING,
        progress: 0,
      });
      const newTask: NewTask<VTONTaskInput> = {
        type: TaskType.VTON,
        inputData: {
          modelImage: getModelSrc(),
          garmentImage: getGarmentSrc(),
          outfitType: tryOnCategory,
          modelMode,
          numSamples,
          seed: defaultSeed,
        },
      };
      // Simulate processing with progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 70) {
            clearInterval(interval);
            return 70;
          }
          return prev + 5;
        });
      }, 500);
      const response = await newVTONTask<VTONTaskInput>(sessionToken, newTask);
      const task = response.data.data;
      if (!task) {
        const errorMessage = "Something went wrong, please try again";
        setVtonError(errorMessage);
        toast.error(errorMessage);
        setIsProcessing(false);
        setTaskProgress(null);
        return;
      }
      if (task.status === TaskStatus.SUCCEEDED) {
        setActiveTab("results");
        setProgress(100);
        setIsProcessing(false);
        setTimeout(() => {
          setResults(task.resultData?.outputImageUrl ?? []);
          setSelectedResult(task.resultData?.outputImageUrl[0] ?? null);
        }, 200);
        return;
      }
      const websocket = new WebSocketClient(task.userId);
      websocket.on<TaskProgress<VtonTaskResultData>>(
        "task-progress-" + task.id,
        (data) => {
          console.log("WebSocket data received:", data);
          setTaskProgress(data);
          if (data.status === TaskStatus.SUCCEEDED) {
            setActiveTab("results");
            setProgress(100);
            setIsProcessing(false);
            setTimeout(() => {
              setResults(data.resultData?.outputImageUrl ?? []);
              setSelectedResult(data.resultData?.outputImageUrl[0] ?? null);
            }, 200);
          } else if (data.status === TaskStatus.FAILED) {
            const errorMessage = "Virtual try-on failed. Please try again.";
            setVtonError(errorMessage);
            toast.error(errorMessage);
            setIsProcessing(false);
            setTaskProgress(null);
          }
        },
      );
    } catch (error) {
      console.error("Error processing virtual try-on:", error);
      setIsProcessing(false);
      setTaskProgress(null);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "Failed to process virtual try-on. Please try again."
          : "An unexpected error occurred. Please try again.";
      setVtonError(errorMessage);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setVtonError(null);
    processVirtualTryOn();
  };

  // Handle reset - clear all state
  const handleReset = () => {
    setVtonError(null);
    setResults([]);
    setSelectedResult(null);
    setTaskProgress(null);
    setIsProcessing(false);
    setProgress(0);
    setActiveTab("model");
  };

  // Check if we can proceed to the next step
  const canProceedToGarment = !!selectedModel || !!uploadedModel;
  const canProceedToConfig = canProceedToGarment && !!garmentImage;
  const canProcessTryOn = canProceedToConfig;

  // Get the current model image source
  const getModelSrc = () => {
    if (uploadedModel) return uploadedModel;
    if (selectedModel) {
      const model = aiModels?.results?.find(
        (m: AIModel) => m.id === selectedModel,
      );
      return model?.modelImageUrl || "";
    }
    return "";
  };

  // Get the current garment image source
  const getGarmentSrc = () => {
    console.log("garmentImage", garmentImage);
    return garmentImage!;
  };

  // Get the current result image source
  const getResultSrc = () => {
    return selectedResult;
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    // Only allow navigation to tabs that are valid based on the current state
    if (
      value === "model" ||
      (value === "garment" && canProceedToGarment) ||
      (value === "config" && canProceedToConfig) ||
      (value === "results" && (isProcessing || results.length > 0 || vtonError))
    ) {
      setActiveTab(value);
    }
  };
  const handleInsertImages = (
    selectedImageIds: string[],
    images: ImageType[],
  ) => {
    const selectedImages = images.filter((img) =>
      selectedImageIds.includes(img.id),
    );
    console.log({ selectedImages });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-0 pl-8 pr-8 md:p-8">
      <div className="max-w-7xl">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Virtual Try-On
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Try clothes on virtual models with AI-powered fitting
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-2">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="garment" disabled={!canProceedToGarment}>
              Garment
            </TabsTrigger>
            <TabsTrigger value="config" disabled={!canProceedToConfig}>
              Configure
            </TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={!isProcessing && results.length === 0}
            >
              Results
            </TabsTrigger>
          </TabsList>

          {/* Model Selection Tab */}
          <TabsContent value="model" className="space-y-1 overflow-y-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Select a Model
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-slate-400 hover:text-slate-600"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                          <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm mb-2">
                            Tips for best results
                          </h3>
                          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
                            <li>Use high-quality images with good lighting</li>
                            <li>Choose models with a neutral pose</li>
                            <li>
                              Full-body images work best for complete outfits
                            </li>
                            <li>Simple backgrounds yield better results</li>
                          </ul>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        onClick={() => setActiveTab("garment")}
                        disabled={!selectedModel && !uploadedModel}
                        className="right-0"
                      >
                        Next: Select Garment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Choose from our gallery or upload your own model image
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Filter controls */}
                      <FilterProvider>
                        <FilterBar />
                        {/* Model gallery */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                          {isFetching || isLoading ? (
                            <div className="col-span-full text-center py-12">
                              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                              <p className="text-slate-500 dark:text-slate-400">
                                Loading models...
                              </p>
                            </div>
                          ) : !aiModels?.results ||
                            aiModels.results.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                              <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                              <p className="text-slate-500 dark:text-slate-400">
                                No models available.
                              </p>
                            </div>
                          ) : currentModels?.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                              <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                              <p className="text-slate-500 dark:text-slate-400">
                                No models found matching your criteria.
                              </p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setModelFilter("all")}
                              >
                                Clear filters
                              </Button>
                            </div>
                          ) : (
                            currentModels?.map((model) => (
                              <div
                                key={model.id}
                                className={cn(
                                  "relative h-40 rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                                  selectedModel === model.id
                                    ? "border-purple-600 shadow-md"
                                    : "border-transparent hover:border-slate-300 dark:hover:border-slate-700",
                                )}
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setUploadedModel(null);
                                  setAiModelUploadedImageInfo(null);
                                }}
                              >
                                <Image
                                  src={
                                    model.modelImageUrl || "/placeholder.svg"
                                  }
                                  alt={model.modelTitle}
                                  fill
                                  className="object-contain"
                                />
                                {selectedModel === model.id && (
                                  <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <div className="flex flex-wrap gap-1">
                                    <Badge
                                      variant="outline"
                                      className="bg-black/50 text-white border-none text-xs"
                                    >
                                      {model.gender}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="bg-black/50 text-white border-none text-xs"
                                    >
                                      {/* {model.styleTags?.join(", ")} */}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      </FilterProvider>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800">
                  <div className="text-center p-4">
                    <ImageUploader
                      onUploaded={handleAIModelImageUploaded}
                      placeholder="Upload your own model"
                      hideImagePreviewAfterUpload
                    />
                  </div>
                </div>
                <Card className="sticky mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Preview
                    </CardTitle>
                    <CardDescription>
                      Your selected model
                      {selectedModel && (
                        <p
                          className="text-green-500"
                          style={{
                            fontSize: "12px",
                            lineHeight: "12px",
                          }}
                        >
                          You can upload your own model image to try on. Please
                          click on the "Reset Selection" button to clear the
                          current model.
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {(selectedModel || uploadedModel) && (
                      <div className="relative h-full rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <Image
                          src={getModelSrc() || "/placeholder.svg"}
                          alt="Selected model"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Garment Selection Tab */}
          <TabsContent value="garment" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Select Garment
                    </CardTitle>
                    <CardDescription>
                      Upload or select a garment image to try on your model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mode Toggle */}
                      <div className="flex items-center justify-center">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                          <div className="flex">
                            <button
                              onClick={() => setGalleryMode(false)}
                              className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                !galleryMode
                                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                              )}
                            >
                              Upload New
                            </button>
                            <button
                              onClick={() => setGalleryMode(true)}
                              className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                galleryMode
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
                      {!galleryMode && (
                        <div className="h-56">
                          <ImageUploader
                            onUploaded={handleGarmentImageUploaded}
                            placeholder="Upload your own garment"
                            hideImagePreviewAfterUpload
                          />
                        </div>
                      )}

                      {/* Gallery Mode */}
                      {galleryMode && (
                        <div className="space-y-4">
                          <ImageGallery
                            hideUploadButton
                            hideActions
                            hideCancelButton
                            maxColumns={3}
                            maxRows={2}
                            imageSelectionLimit={1}
                            onSelected={handleGarmentImageSelected}
                            onClose={() => setShowImageGallery(false)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={() => setActiveTab("config")}
                      disabled={!garmentImage}
                    >
                      Next: Configure Try-On
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
                <div className="flex items-start gap-2 mt-4 space-y-6">
                  <div className="p-4 w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-slate-400" />
                      <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm ">
                        Tips for garment selection
                      </h3>
                    </div>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-4">
                      <li>
                        Use images with clean backgrounds for better results
                      </li>
                      <li>
                        Flat-lay garment photos work best for accurate fitting
                      </li>
                      <li>
                        Make sure the entire garment is visible in the image
                      </li>
                      <li>
                        Higher resolution images produce better try-on results
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Your selected items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Model</p>
                        <div className="aspect-[2/3] rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                          {selectedModel || uploadedModel ? (
                            <Image
                              src={getModelSrc() || "/placeholder.svg"}
                              alt="Selected model"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                              <User className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Garment</p>
                        <div className="aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                          {garmentImage ? (
                            <Image
                              src={getGarmentSrc() || "/placeholder.svg"}
                              alt="Selected garment"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                              <Shirt className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">
                        Selected Options
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Category:
                          </span>
                          <span className="font-medium capitalize">
                            {tryOnCategory}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Mode:
                          </span>
                          <span className="font-medium capitalize">
                            {modelMode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Samples:
                          </span>
                          <span className="font-medium">{numSamples}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Seed:
                          </span>
                          <span className="font-medium">{seed}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configure Try-On Settings</CardTitle>
                    <CardDescription>
                      Customize how the virtual try-on will be processed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Try-on category */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Try-On Category</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                              tryOnCategory === OutfitType.TOP
                                ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                            )}
                            onClick={() => setTryOnCategory(OutfitType.TOP)}
                          >
                            <Shirt className="h-8 w-8 mb-2 text-slate-700 dark:text-slate-300" />
                            <span className="text-sm font-medium">Top</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Shirts, jackets, etc.
                            </span>
                          </div>
                          <div
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                              tryOnCategory === OutfitType.BOTTOM
                                ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                            )}
                            onClick={() => setTryOnCategory(OutfitType.BOTTOM)}
                          >
                            <Pants className="h-8 w-8 mb-2 text-slate-700 dark:text-slate-300" />
                            <span className="text-sm font-medium">Bottom</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Pants, skirts, etc.
                            </span>
                          </div>
                          <div
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                              tryOnCategory === OutfitType.FULL_BODY
                                ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                                : "border-slate-200 dark:border-slate-700",
                            )}
                            onClick={() =>
                              setTryOnCategory(OutfitType.FULL_BODY)
                            }
                          >
                            <User className="h-8 w-8 mb-2 text-slate-700 dark:text-slate-300" />
                            <span className="text-sm font-medium">
                              Full Outfit
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Dresses, suits, etc.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Model mode */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Model Mode</h3>
                        <RadioGroup
                          value={modelMode}
                          onValueChange={(val) =>
                            setModelMode(val as VTONModelMode)
                          }
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <div
                            className={cn(
                              "flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all",
                              modelMode === VTONModelMode.PERFORMANCE
                                ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                                : "border-slate-200 dark:border-slate-700",
                            )}
                          >
                            <RadioGroupItem
                              value={VTONModelMode.PERFORMANCE}
                              id="performance"
                              className="sr-only"
                            />
                            <Label
                              htmlFor="performance"
                              className="flex flex-col cursor-pointer"
                            >
                              <span className="font-medium mb-1">
                                Performance
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Faster processing with good quality results
                              </span>
                              <div className="flex items-center mt-2">
                                <Tally5 className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-xs font-medium text-green-500">
                                  Speed
                                </span>
                                <span className="mx-2 text-slate-300 dark:text-slate-600">
                                  |
                                </span>
                                <Tally2 className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs font-medium text-amber-500">
                                  Quality
                                </span>
                              </div>
                            </Label>
                          </div>
                          <div
                            className={cn(
                              "flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all",
                              modelMode === VTONModelMode.BALANCED
                                ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                                : "border-slate-200 dark:border-slate-700",
                            )}
                          >
                            <RadioGroupItem
                              value={VTONModelMode.BALANCED}
                              id="balanced"
                              className="sr-only"
                            />
                            <Label
                              htmlFor="balanced"
                              className="flex flex-col cursor-pointer"
                            >
                              <span className="font-medium mb-1">Balanced</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Good balance between speed and quality
                              </span>
                              <div className="flex items-center mt-2">
                                <Tally3 className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs font-medium text-amber-500">
                                  Speed
                                </span>
                                <span className="mx-2 text-slate-300 dark:text-slate-600">
                                  |
                                </span>
                                <Tally3 className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs font-medium text-amber-500">
                                  Quality
                                </span>
                              </div>
                            </Label>
                          </div>
                          <div
                            className={cn(
                              "flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all",
                              modelMode === VTONModelMode.QUALITY
                                ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                                : "border-slate-200 dark:border-slate-700",
                            )}
                          >
                            <RadioGroupItem
                              value={VTONModelMode.QUALITY}
                              id="quality"
                              className="sr-only"
                            />
                            <Label
                              htmlFor="quality"
                              className="flex flex-col cursor-pointer"
                            >
                              <span className="font-medium mb-1">Quality</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Highest quality results with slower processing
                              </span>
                              <div className="flex items-center mt-2">
                                <Tally2 className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs font-medium text-amber-500">
                                  Speed
                                </span>
                                <span className="mx-2 text-slate-300 dark:text-slate-600">
                                  |
                                </span>
                                <Tally5 className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-xs font-medium text-green-500">
                                  Quality
                                </span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Advanced options */}
                      {/* <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Advanced Options
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label
                                  htmlFor="cover-feet"
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  Cover Feet
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Ensure feet are properly covered with footwear
                                </p>
                              </div>
                              <Switch
                                id="cover-feet"
                                checked={coverFeet}
                                onCheckedChange={setCoverFeet}
                                className="data-[state=checked]:bg-purple-600"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label
                                  htmlFor="adjust-hands"
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  Adjust Hands
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Automatically position hands naturally with
                                  the outfit
                                </p>
                              </div>
                              <Switch
                                id="adjust-hands"
                                checked={adjustHands}
                                onCheckedChange={setAdjustHands}
                                className="data-[state=checked]:bg-purple-600"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label
                                  htmlFor="restore-background"
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  Restore Background
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Preserve the original image background
                                </p>
                              </div>
                              <Switch
                                id="restore-background"
                                checked={restoreBackground}
                                onCheckedChange={setRestoreBackground}
                                className="data-[state=checked]:bg-purple-600"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label
                                  htmlFor="restore-clothes"
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  Restore Clothes
                                </Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Keep parts of original clothing visible when
                                  appropriate
                                </p>
                              </div>
                              <Switch
                                id="restore-clothes"
                                checked={restoreClothes}
                                onCheckedChange={setRestoreClothes}
                                className="data-[state=checked]:bg-purple-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div> */}

                      {/* Generation parameters */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Generation Parameters
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="num-samples">
                                Number of Samples
                              </Label>
                              <span className="text-sm text-slate-500">
                                {numSamples}
                              </span>
                            </div>
                            <Slider
                              id="num-samples"
                              min={1}
                              max={4}
                              step={1}
                              value={[numSamples]}
                              onValueChange={(value) => setNumSamples(value[0])}
                              className="py-2"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Generate multiple variations to choose from
                            </p>
                          </div>
                          {/* <div className="space-y-2">
                            <Label htmlFor="seed">Seed Value</Label>
                            <div className="flex gap-2">
                              <Input
                                id="seed"
                                type="number"
                                value={seed}
                                onChange={(e) =>
                                  setSeed(Number.parseInt(e.target.value) || 0)
                                }
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={generateRandomSeed}
                              >
                                <Shuffle className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Set a specific seed for reproducible results
                            </p>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("garment")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Garment
                    </Button>
                    <Button
                      onClick={() =>
                        vtonError ? handleRetry() : processVirtualTryOn()
                      }
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : vtonError ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Try Again
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Virtual Try-On
                        </>
                      )}
                    </Button>
                  </CardFooter>

                  {vtonError && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {vtonError}
                      </p>
                    </div>
                  )}
                </Card>
              </div>

              <div>
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Your selected items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Model</p>
                        <div className="aspect-[2/3] rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                          {selectedModel || uploadedModel ? (
                            <Image
                              src={getModelSrc() || "/placeholder.svg"}
                              alt="Selected model"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                              <User className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Garment</p>
                        <div className="aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                          {garmentImage ? (
                            <Image
                              src={getGarmentSrc() || "/placeholder.svg"}
                              alt="Selected garment"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                              <Shirt className="h-8 w-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">
                        Selected Options
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Category:
                          </span>
                          <span className="font-medium capitalize">
                            {tryOnCategory}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Mode:
                          </span>
                          <span className="font-medium capitalize">
                            {modelMode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Seed:
                          </span>
                          <span className="font-medium">{seed}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-8">
            {isProcessing ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      Processing Virtual Try-On
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Our AI is fitting the garment to your model. This may take
                      a moment depending on the selected quality settings.
                    </p>
                  </div>
                  <div className="w-full max-w-md mb-8">
                    <Progress value={progress} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Preparing</span>
                      <span>Fitting</span>
                      <span>Refining</span>
                      <span>Finalizing</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                    {progress < 30 && "Analyzing model and garment..."}
                    {progress >= 30 &&
                      progress < 60 &&
                      "Fitting garment to model..."}
                    {progress >= 60 &&
                      progress < 90 &&
                      "Adjusting details and lighting..."}
                    {progress >= 90 && "Finalizing the virtual try-on..."}
                  </div>
                </CardContent>
              </Card>
            ) : vtonError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-8 text-center">
                    <XIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">
                      Virtual Try-On Failed
                    </h3>
                    <p className="text-red-500 dark:text-red-300 max-w-md mx-auto">
                      {vtonError}
                    </p>
                    <Button className="mt-4" onClick={handleRetry}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Try-On Results</CardTitle>
                      <CardDescription>
                        {numSamples > 1
                          ? `Generated ${results.length} variations based on your settings`
                          : "Generated result based on your settings"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Main result view */}
                        <div
                          className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-w-xs mx-auto flex items-center justify-center"
                          style={{ aspectRatio: "3 / 4" }}
                        >
                          {selectedResult && (
                            <EnhancedImage
                              src={getResultSrc() || "/placeholder.svg"}
                              alt="Virtual try-on result"
                              width={500}
                              height={500}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>

                        {/* Variations */}
                        {results.length > 1 && (
                          <div>
                            {results.length > 1 && (
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">
                                    All Variants
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                    {results.map((image, index) => (
                                      <div
                                        key={image}
                                        className={cn(
                                          "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                          selectedResult === image
                                            ? "border-purple-500 ring-2 ring-purple-200"
                                            : "border-slate-200 hover:border-purple-300",
                                        )}
                                        onClick={() => setSelectedResult(image)}
                                      >
                                        <EnhancedImage
                                          src={image}
                                          height={120}
                                          width={90}
                                          alt={`Variant ${image}`}
                                          hideFullscreenPreview
                                          className="w-full h-auto object-contain"
                                        />
                                        <div className="absolute top-1 left-1">
                                          <Badge
                                            variant="secondary"
                                            className="text-xs px-1 py-0"
                                          >
                                            {index}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab("config")}
                          >
                            <Settings className="mr-2 h-3 w-3" />
                            Adjust Settings
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              vtonError
                                ? handleRetry()
                                : processVirtualTryOn(
                                    Math.floor(Math.random() * (2 ** 32 - 5)) +
                                      1,
                                  )
                            }
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Processing...
                              </>
                            ) : vtonError ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Try Again
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-3 w-3" />
                                Generate New Variations
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(results)}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Download {results.length > 1 ? "All" : "Result"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="sticky top-8">
                    <CardHeader>
                      <CardTitle>Input Images</CardTitle>
                      <CardDescription>
                        The original images used
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Model</p>
                          <div className="aspect-[2/3] rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                            <Image
                              src={getModelSrc() || "/placeholder.svg"}
                              alt="Selected model"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Garment</p>
                          <div className="aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                            <Image
                              src={getGarmentSrc() || "/placeholder.svg"}
                              alt="Selected garment"
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <h3 className="text-sm font-medium mb-2">
                          Settings Used
                        </h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Category:
                            </span>
                            <span className="font-medium capitalize">
                              {tryOnCategory}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Mode:
                            </span>
                            <span className="font-medium capitalize">
                              {modelMode}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Cover Feet:
                            </span>
                            <span className="font-medium">
                              {coverFeet ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Adjust Hands:
                            </span>
                            <span className="font-medium">
                              {adjustHands ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Restore Background:
                            </span>
                            <span className="font-medium">
                              {restoreBackground ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Restore Clothes:
                            </span>
                            <span className="font-medium">
                              {restoreClothes ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Seed:
                            </span>
                            <span className="font-medium">{seed}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveTab("garment")}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Try More Outfits
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Results Yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                    Configure your virtual try-on settings and generate results
                    to see them here.
                  </p>
                  <Button className="mt-4" onClick={handleReset}>
                    Start Over
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* How it works section */}
            <Card>
              <CardHeader>
                <CardTitle>How Virtual Try-On Works</CardTitle>
                <CardDescription>
                  Understanding the AI-powered fitting process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                      <Layers className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Image Analysis</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Our AI analyzes both the model and garment images to
                      understand body shape, pose, and garment characteristics.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                      <Shirt className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Virtual Fitting
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      The garment is digitally warped and fitted to match the
                      model's body shape, pose, and proportions.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                      <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Detail Refinement
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Advanced AI algorithms refine details like lighting,
                      shadows, and fabric texture for realistic results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
