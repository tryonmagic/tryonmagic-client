"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Upload, ImagePlus, Sparkles, Loader2, Download, Trash2, Info,
  Palette, Wand2, Camera, Layers, Zap, RefreshCw, Eye, Settings,
  Brush, Scissors, Move3D, Sun, Moon, Droplets, Wind, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ImageInfo } from "@/lib/uploader/components/ImageUploader"
import ImageUploader from "@/lib/uploader/components/ImageUploader"
import { useAppBridge } from "@shopify/app-bridge-react"
import { WebSocketClient } from "@/socket"
import {
  TaskProgress,
  TaskStatus,
  TaskType,
  NewTask,
  ProductImageEditTaskInput,
  ProductImageEditingType,
  ImageSourceType,
  StyleType,
  SceneType,
  VariantType,
  ProductImageEditTaskResultData
} from "@/lib/api/type"
import { createProductImageEditTask } from "@/lib/api/product-image-editing"
import EnhancedImage from "@/components/ui/EnhanchedImage"

// Enhanced product editing modes
const editingModes = [
  {
    id: "scene",
    title: "Scene Generation",
    description: "Replace backgrounds and place products in realistic lifestyle and commercial settings",
    icon: Move3D,
    color: "from-indigo-500 to-purple-500",
    features: ["Background removal", "Scene generation", "Lifestyle scenes", "Commercial settings", "Lighting adjustment", "Shadow matching"]
  },
  {
    id: "recolor",
    title: "Product Recoloring",
    description: "Change product colors while maintaining texture and details",
    icon: Palette,
    color: "from-purple-500 to-pink-500",
    features: ["Color replacement", "Texture preservation", "Multiple variants", "Brand matching"]
  },
  // {
  //   id: "style",
  //   title: "Style Transfer",
  //   description: "Apply artistic styles and visual effects to your products",
  //   icon: Brush,
  //   color: "from-orange-500 to-red-500",
  //   features: ["Artistic filters", "Mood enhancement", "Brand styling", "Creative effects"]
  // },
  // {
  //   id: "enhance",
  //   title: "Product Enhancement",
  //   description: "Improve product presentation with AI-powered enhancements",
  //   icon: Wand2,
  //   color: "from-green-500 to-emerald-500",
  //   features: ["Detail enhancement", "Lighting optimization", "Quality upscaling", "Professional polish"]
  // },
  {
    id: "variants",
    title: "Product Variants",
    description: "Generate multiple product variations and configurations",
    icon: Layers,
    color: "from-teal-500 to-blue-500",
    features: ["Size variations", "Configuration options", "Angle generation", "Batch processing"]
  }
]

// Enhanced background scenes with more creative options
const backgroundScenes = [
  {
    value: "studio_minimal",
    label: "Minimal Studio",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=100&fit=crop",
    description: "Clean, minimal studio with soft shadows",
    mood: "professional"
  },
  {
    value: "lifestyle_home",
    label: "Modern Home",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=100&fit=crop",
    description: "Contemporary home interior setting",
    mood: "cozy"
  },
  {
    value: "outdoor_nature",
    label: "Natural Outdoor",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=100&fit=crop",
    description: "Natural outdoor environment with organic lighting",
    mood: "fresh"
  },
  {
    value: "luxury_boutique",
    label: "Luxury Boutique",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=100&fit=crop",
    description: "High-end retail environment with premium feel",
    mood: "elegant"
  },
  {
    value: "industrial_loft",
    label: "Industrial Loft",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=100&fit=crop",
    description: "Urban industrial setting with raw textures",
    mood: "edgy"
  },
  {
    value: "seasonal_winter",
    label: "Winter Scene",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=100&fit=crop",
    description: "Cozy winter atmosphere with warm lighting",
    mood: "seasonal"
  },
  {
    value: "tech_futuristic",
    label: "Tech Future",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=100&fit=crop",
    description: "Futuristic tech environment with neon accents",
    mood: "innovative"
  },
  {
    value: "vintage_retro",
    label: "Vintage Retro",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=150&h=100&fit=crop",
    description: "Nostalgic retro setting with vintage charm",
    mood: "nostalgic"
  }
]

// Enhanced style presets
const stylePresets = [
  {
    value: "photorealistic",
    label: "Photorealistic",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    description: "Ultra-realistic photography style",
    intensity: "high"
  },
  {
    value: "cinematic",
    label: "Cinematic",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop",
    description: "Movie-like dramatic lighting and composition",
    intensity: "medium"
  },
  {
    value: "minimalist",
    label: "Minimalist",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    description: "Clean, simple aesthetic with negative space",
    intensity: "low"
  },
  {
    value: "artistic",
    label: "Artistic",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100&h=100&fit=crop",
    description: "Creative artistic interpretation",
    intensity: "high"
  },
  {
    value: "commercial",
    label: "Commercial",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    description: "Professional commercial photography",
    intensity: "medium"
  },
  {
    value: "editorial",
    label: "Editorial",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    description: "Magazine-style editorial presentation",
    intensity: "medium"
  }
]

// Color palette options for recoloring
const colorPalettes = [
  {
    name: "Classic",
    colors: ["#000000", "#FFFFFF", "#8B4513", "#000080", "#800000"]
  },
  {
    name: "Vibrant",
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
  },
  {
    name: "Pastel",
    colors: ["#FFB3BA", "#BAFFC9", "#BAE1FF", "#FFFFBA", "#FFD3BA"]
  },
  {
    name: "Earth",
    colors: ["#8B4513", "#D2691E", "#CD853F", "#DEB887", "#F4A460"]
  },
  {
    name: "Monochrome",
    colors: ["#000000", "#404040", "#808080", "#C0C0C0", "#FFFFFF"]
  }
]

interface EditingModeCardProps {
  mode: typeof editingModes[0]
  isSelected: boolean
  onClick: () => void
}

function EditingModeCard({ mode, isSelected, onClick }: EditingModeCardProps) {
  const Icon = mode.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300",
        isSelected
          ? "border-purple-500 shadow-lg shadow-purple-500/25"
          : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
      )}
      onClick={onClick}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", mode.color)} />
      <CardContent className="relative p-6">
        <div className="flex items-start space-x-4">
          <div className={cn("rounded-lg p-3 bg-gradient-to-br", mode.color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-2">{mode.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {mode.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {mode.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </motion.div>
  )
}

interface ColorPaletteProps {
  palette: typeof colorPalettes[0]
  selectedColor: string
  onColorSelect: (color: string) => void
}

function ColorPalette({ palette, selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{palette.name}</Label>
      <div className="flex space-x-2">
        {palette.colors.map((color) => (
          <button
            key={color}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all duration-200",
              selectedColor === color
                ? "border-purple-500 scale-110 shadow-lg"
                : "border-slate-300 hover:scale-105"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onColorSelect(color)}
          />
        ))}
      </div>
    </div>
  )
}

interface CustomColorInputProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

function CustomColorInput({ selectedColor, onColorSelect }: CustomColorInputProps) {
  const [customColor, setCustomColor] = useState(selectedColor)
  const [isValidColor, setIsValidColor] = useState(true)

  const validateAndSetColor = (color: string) => {
    setCustomColor(color)

    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    const isValid = hexRegex.test(color)
    setIsValidColor(isValid)

    if (isValid) {
      onColorSelect(color)
    }
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    setIsValidColor(true)
    onColorSelect(color)
  }

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
            placeholder="#FF6B6B"
            value={customColor}
            onChange={(e) => validateAndSetColor(e.target.value)}
            className={cn(
              "font-mono text-sm",
              !isValidColor && "border-red-500 focus:border-red-500"
            )}
          />
          {!isValidColor && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid hex color (e.g., #FF6B6B)
            </p>
          )}
        </div>

        {/* Apply Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onColorSelect(customColor)}
          disabled={!isValidColor}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview */}
      <div className="flex items-center space-x-2">
        <div
          className="w-6 h-6 rounded-full border-2 border-slate-300"
          style={{ backgroundColor: isValidColor ? customColor : '#transparent' }}
        />
        <span className="text-xs text-slate-500">
          {isValidColor ? 'Preview' : 'Invalid color'}
        </span>
      </div>
    </div>
  )
}

export default function AIProductPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedMode, setSelectedMode] = useState("scene")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageInfo, setUploadedImageInfo] = useState<ImageInfo | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [taskProgress, setTaskProgress] = useState<TaskProgress<ProductImageEditTaskResultData> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const appBridge = useAppBridge()

  const [formData, setFormData] = useState({
    // Smart Background settings
    backgroundPrompt: "",
    preserveLighting: true,
    matchShadows: true,
    enhanceQuality: true,
    backgroundStyle: "studio_minimal",
    lightingAdjustment: "natural",

    // Style Transfer settings  
    styleType: StyleType.ARTISTIC,
    stylePrompt: "",
    styleReferenceImageUrl: "",
    intensity: 0.7,
    preserveDetails: true,
    brandGuidelines: "",

    // Scene Generation settings
    sceneType: SceneType.LIFESTYLE,
    scenePrompt: "",
    contextDescription: "",
    lifestyleSettings: "",
    brandEnvironment: "",
    lightingConditions: "natural",
    targetAudience: "",

    // Product Variants settings
    variantType: VariantType.SIZE,
    variantPrompt: "",
    numberOfVariants: 1,
    sizeVariations: ["small", "medium", "large"],
    configurationOptions: [],
    angleVariations: ["front", "side", "back"],
    colorVariations: ["#FF6B6B"],
    materialVariations: [],

    // Recolor settings
    itemsToRecolor: "",

    // Legacy settings for compatibility  
    scene: "studio_minimal",
    style: "photorealistic",
    selectedColor: "#FF6B6B",
    prompt: "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }



  const handleGenerate = async () => {
    if (!uploadedImageInfo) return

    setIsGenerating(true)
    setActiveTab("result")
    setGeneratedImages([])
    setTaskProgress({
      status: TaskStatus.PENDING,
      progress: 0,
    })

    try {
      const sessionToken = await appBridge.idToken()

      // Map the selected mode to the processing type
      const processingTypeMap: Record<string, ProductImageEditingType> = {
        scene: ProductImageEditingType.SCENE_GENERATION,
        style: ProductImageEditingType.STYLE_TRANSFER,
        variants: ProductImageEditingType.PRODUCT_VARIANTS,
        recolor: ProductImageEditingType.PRODUCT_COLOR_VARIANTS,
      }

      const taskInput: ProductImageEditTaskInput = {
        sourceImageUrl: uploadedImageInfo.uploadLocation,
        imageSourceType: ImageSourceType.URL,
        processingType: processingTypeMap[selectedMode],

        // Scene Generation fields (merged from Smart Background and Scene Generation)
        ...(selectedMode === "scene" && {
          // Background/Scene prompt and settings
          backgroundPrompt: formData.prompt,
          scenePrompt: formData.prompt,

          // Background enhancement settings
          preserveLighting: formData.preserveLighting,
          matchShadows: formData.matchShadows,
          enhanceQuality: formData.enhanceQuality,
          backgroundStyle: formData.backgroundStyle,
          lightingAdjustment: formData.lightingAdjustment,

          // Scene generation settings
          sceneType: formData.sceneType,
          contextDescription: formData.contextDescription,
          lifestyleSettings: formData.lifestyleSettings,
          brandEnvironment: formData.brandEnvironment,
          lightingConditions: formData.lightingConditions,
          targetAudience: formData.targetAudience,
        }),

        // Style Transfer fields
        ...(selectedMode === "style" && {
          styleType: formData.styleType,
          stylePrompt: formData.prompt,
          intensity: formData.intensity,
          preserveDetails: formData.preserveDetails,
          brandGuidelines: formData.brandGuidelines,
        }),

        // Product Variants fields
        ...(selectedMode === "variants" && {
          variantType: formData.variantType,
          variantPrompt: formData.prompt,
          numberOfVariants: formData.numberOfVariants,
          sizeVariations: formData.sizeVariations,
          configurationOptions: formData.configurationOptions,
          angleVariations: formData.angleVariations,
          colorVariations: formData.colorVariations,
          materialVariations: formData.materialVariations,
        }),

        // Recolor fields
        ...(selectedMode === "recolor" && {
          prompt: formData.prompt,
          itemsToRecolor: formData.itemsToRecolor,
          color: formData.selectedColor.replace("#", ""),
        }),
      }

      const newTask: NewTask<ProductImageEditTaskInput> = {
        type: TaskType.PRODUCT_IMAGE_EDITING,
        inputData: taskInput,
      }

      const response = await createProductImageEditTask(sessionToken, newTask)
      const task = response.data.data

      if (!task) {
        console.error("No task data returned")
        setIsGenerating(false)
        return
      }

      // Listen for WebSocket updates
      const websocket = new WebSocketClient(task.userId)
      websocket.on<TaskProgress<ProductImageEditTaskResultData>>("task-progress", (data) => {
        console.log("WebSocket data received:", data)
        setTaskProgress(data)

        if (data.status === TaskStatus.SUCCEEDED) {
          setIsGenerating(false)

          if (data.resultData?.outputImageUrl) {
            const images = Array.isArray(data.resultData.outputImageUrl)
              ? data.resultData.outputImageUrl
              : [data.resultData.outputImageUrl]
            setGeneratedImages(images)
            setSelectedImageIndex(0)
          }
        }

        if (data.status === TaskStatus.FAILED) {
          setIsGenerating(false)
          console.error("Task failed:", data)
        }
      })

    } catch (error) {
      console.error("Error generating image:", error)
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setUploadedImage(null)
    setUploadedImageInfo(null)
    setGeneratedImages([])
    setSelectedImageIndex(0)
    setTaskProgress(null)
    setActiveTab("upload")
  }

  const handleImageUploaded = (imageInfo: ImageInfo) => {
    setUploadedImageInfo(imageInfo)
    setUploadedImage(imageInfo.previewImageUrl)
    setActiveTab("edit")
  }

  const getCurrentModeSettings = () => {
    switch (selectedMode) {
      case "scene":
        return (
          <div className="space-y-6">

            <div className="space-y-4">
              {/* <div className="space-y-2">
                <Label>Lighting Conditions</Label>
                <Select
                  value={formData.lightingConditions}
                  onValueChange={(value) => handleInputChange("lightingConditions", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural Light</SelectItem>
                    <SelectItem value="studio">Studio Lighting</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="soft">Soft Diffused</SelectItem>
                    <SelectItem value="warm">Warm Ambient</SelectItem>
                    <SelectItem value="cool">Cool Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>

          </div>
        )

      case "recolor":
        return (
          <div className="space-y-6 mt-4">
            <Tabs defaultValue="precise" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="precise" className="text-sm">
                  Precise Recolor
                </TabsTrigger>
                <TabsTrigger value="creative" className="text-sm">
                  Creative Recolor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="precise" className="space-y-4 mt-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        100% Accurate Color Replacement
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Precise recolor items using advanced algorithms
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Items to Recolor</Label>
                    <Textarea
                      placeholder="e.g., shirt sleeves, collar, buttons, logo, fabric pattern"
                      value={formData.itemsToRecolor}
                      onChange={(e) => handleInputChange("itemsToRecolor", e.target.value)}
                      className="min-h-[60px]"
                    />
                    <p className="text-xs text-slate-500">
                      Specify which parts of the product you want to recolor. Separate multiple items with commas.
                    </p>
                  </div>

                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Color Palettes</Label>
                  {colorPalettes.map((palette) => (
                    <ColorPalette
                      key={palette.name}
                      palette={palette}
                      selectedColor={formData.selectedColor}
                      onColorSelect={(color) => handleInputChange("selectedColor", color)}
                    />
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Custom Color Input */}
                <CustomColorInput
                  selectedColor={formData.selectedColor}
                  onColorSelect={(color) => handleInputChange("selectedColor", color)}
                />

              </TabsContent>

              <TabsContent value="creative" className="space-y-4 mt-4">
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        AI-Powered Creative Recoloring
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                        Creative color transformations with multiple colors and effects
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Color Instructions</Label>
                    <Textarea
                      placeholder="e.g., 'Make it bright red with gold accents' or 'Change to gradient from blue to green'"
                      value={formData.prompt}
                      onChange={(e) => {
                        handleInputChange("itemsToRecolor", "")
                        handleInputChange("prompt", e.target.value)
                      }}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Quick Color Suggestions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Vibrant rainbow gradient",
                        "Metallic gold finish",
                        "Matte black with highlights",
                        "Pastel color palette",
                        "Neon glow effect",
                        "Vintage faded colors"
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 justify-start"
                          onClick={() => handleInputChange("prompt", suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>

                </div>
              </TabsContent>
            </Tabs>
          </div>
        )

      case "style":
        return <></>

      default:
        return <></>
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
              AI Product Studio
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Transform your products with advanced AI-powered editing and enhancement
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="upload" disabled={isGenerating}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="edit" disabled={!uploadedImageInfo || isGenerating}>
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!uploadedImageInfo || (!generatedImages.length && !isGenerating)}>
              <Eye className="h-4 w-4 mr-2" />
              Result
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Upload Your Product</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ImageUploader onUploaded={handleImageUploaded} />

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                          Pro Tips for Best Results
                        </h3>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                          <li>• Use high-resolution images (1024px+ recommended)</li>
                          <li>• Ensure good lighting and clear product visibility</li>
                          <li>• Simple backgrounds work best for advanced editing</li>
                          <li>• Center your product in the frame</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editing Modes Preview */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  What You Can Do
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {editingModes.slice(0, 3).map((mode) => (
                    <EditingModeCard
                      key={mode.id}
                      mode={mode}
                      isSelected={false}
                      onClick={() => { }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-6">
            {uploadedImageInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Editing Modes */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-lg font-semibold">Choose Editing Mode</h3>
                  <div className="space-y-3">
                    {editingModes.map((mode) => (
                      <EditingModeCard
                        key={mode.id}
                        mode={mode}
                        isSelected={selectedMode === mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Settings Panel */}
                <Card className="lg:col-span-1">

                  <CardContent>
                    {getCurrentModeSettings()}
                    <br />
                    {/* Common Settings */}
                    {selectedMode !== "recolor" && <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Custom Instructions</Label>
                        <Textarea
                          placeholder="Describe specific requirements..."
                          value={formData.prompt}
                          onChange={(e) => handleInputChange("prompt", e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Number of Variants</Label>
                        <Select
                          value={formData.numberOfVariants.toString()}
                          onValueChange={(value) => handleInputChange("numberOfVariants", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 variant</SelectItem>
                            <SelectItem value="2">2 variants</SelectItem>
                            <SelectItem value="3">3 variants</SelectItem>
                            <SelectItem value="4">4 variants</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>}
                  </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={uploadedImage || ""}
                          alt="Product preview"
                          className="w-full h-auto object-contain"
                        />
                      </div>

                      <Button
                        onClick={handleGenerate}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate {formData.numberOfVariants} Variant{formData.numberOfVariants > 1 ? 's' : ''}
                      </Button>

                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="w-full"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Start Over
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Result Tab */}
          <TabsContent value="result" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              {isGenerating ? (
                <Card className="w-full max-w-2xl mx-auto">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                      <div className="relative">
                        <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
                        <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">
                          AI is working its magic...
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                          Creating {formData.numberOfVariants} {selectedMode === 'scene' ? 'scene generation' : selectedMode} variant{formData.numberOfVariants > 1 ? 's' : ''}
                          {taskProgress?.status && (
                            <span className="block mt-1">
                              Status: {taskProgress.status.toLowerCase()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : generatedImages.length > 0 ? (
                <div className="space-y-6">
                  {/* Image Comparison */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium text-center mb-3 text-slate-600 dark:text-slate-400">
                            Original
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                              src={uploadedImage || ""}
                              alt="Original"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-center mb-3 text-slate-600 dark:text-slate-400">
                            AI Enhanced
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <EnhancedImage
                              src={generatedImages[selectedImageIndex]}
                              alt="Enhanced"
                              height={500}
                              width={400}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variants Grid */}
                  {generatedImages.length > 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>All Variants</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {generatedImages.map((image, index) => (
                            <div
                              key={index}
                              className={cn(
                                "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                selectedImageIndex === index
                                  ? "border-purple-500 ring-2 ring-purple-200"
                                  : "border-slate-200 hover:border-purple-300"
                              )}
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <EnhancedImage
                                src={image}
                                height={500}
                                width={400}
                                alt={`Variant ${index + 1}`}
                                className="w-full h-auto object-contain"
                              />
                              <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="text-xs">
                                  {index + 1}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => setActiveTab("edit")}
                      variant="outline"
                      className="flex-1"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Adjust Settings
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate New Variants
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Selected
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

