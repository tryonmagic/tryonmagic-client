"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Upload, ImagePlus, Sparkles, Loader2, Download, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const productScenes = [
  {
    value: "studio",
    label: "Studio",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Clean studio background with professional lighting",
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Natural lifestyle setting showing product in use",
  },
  {
    value: "outdoor",
    label: "Outdoor",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Outdoor environment with natural lighting",
  },
  {
    value: "minimalist",
    label: "Minimalist",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Clean, minimal background with subtle shadows",
  },
  {
    value: "luxury",
    label: "Luxury",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Upscale luxury setting with elegant details",
  },
  {
    value: "tech",
    label: "Tech",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Modern tech environment with futuristic elements",
  },
  {
    value: "seasonal",
    label: "Seasonal",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=150",
    description: "Seasonal themed background (summer, winter, etc.)",
  },
]

const productStyles = [
  {
    value: "realistic",
    label: "Realistic",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Photorealistic rendering with accurate details",
  },
  {
    value: "stylized",
    label: "Stylized",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Artistic interpretation with enhanced colors",
  },
  {
    value: "dramatic",
    label: "Dramatic",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Bold lighting and high contrast for impact",
  },
  {
    value: "vintage",
    label: "Vintage",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Retro aesthetic with period-appropriate styling",
  },
  {
    value: "flat-lay",
    label: "Flat Lay",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Top-down composition with arranged elements",
  },
]

const productCategories = [
  {
    value: "fashion",
    label: "Fashion & Apparel",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Clothing, accessories, and wearable items",
  },
  {
    value: "electronics",
    label: "Electronics",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Gadgets, devices, and tech products",
  },
  {
    value: "home",
    label: "Home & Decor",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Furniture, decor, and home goods",
  },
  {
    value: "beauty",
    label: "Beauty & Cosmetics",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Makeup, skincare, and beauty products",
  },
  {
    value: "food",
    label: "Food & Beverage",
    image: "https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=100&width=100",
    description: "Food products, drinks, and culinary items",
  },
]

interface OptionItemProps {
  label: string
  image: string
  description?: string
}

function OptionItem({ label, image, description }: OptionItemProps) {
  return (
    <div className="flex items-center space-x-3 p-1">
      <div className="relative h-12 w-12 overflow-hidden rounded-md">
        <img src={image || "/placeholder.svg"} alt={label} className="h-full w-full object-cover" />
      </div>
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </div>
  )
}

interface VisualSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: any[]
  label: string
}

function VisualSelect({ value, onValueChange, options, label }: VisualSelectProps) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center space-x-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-md">
                  <img
                    src={selectedOption.image || "/placeholder.svg"}
                    alt={selectedOption.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="p-0 focus:bg-transparent data-[state=checked]:bg-transparent"
              >
                <div
                  className={cn(
                    "rounded-md p-2 transition-colors",
                    value === option.value ? "bg-muted" : "hover:bg-muted/50",
                  )}
                >
                  <OptionItem label={option.label} image={option.image} description={option.description} />
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}

interface ExampleCardProps {
  title: string
  description: string
  before: string
  after: string
}

function ExampleCard({ title, description, before, after }: ExampleCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">{title}</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-center mb-2 font-medium text-slate-500 dark:text-slate-400">Before</p>
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
            <p className="text-xs text-center mb-2 font-medium text-slate-500 dark:text-slate-400">After</p>
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
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function AIProductPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [formData, setFormData] = useState({
    scene: "studio",
    style: "realistic",
    category: "fashion",
    prompt: "Professional product photography with clean background and soft shadows",
    negativePrompt: "distorted proportions, blurry, low quality",
    preserveColors: true,
    enhanceDetails: true,
    lightingIntensity: 50,
    shadowIntensity: 30,
  })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setActiveTab("customize")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!uploadedImage) return

    setIsGenerating(true)
    setActiveTab("result")

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // In a real app, you would call your AI service here
    // For demo purposes, we'll use a placeholder image
    setGeneratedImage("https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=800&width=800")
    setIsGenerating(false)
  }

  const handleReset = () => {
    setUploadedImage(null)
    setGeneratedImage(null)
    setActiveTab("upload")
  }

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
              AI Product Transformer
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Transform your product photos with AI-generated backgrounds and styling
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="upload" disabled={isGenerating}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="customize" disabled={!uploadedImage || isGenerating}>
              Customize
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!uploadedImage || (!generatedImage && !isGenerating)}>
              Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Upload Your Product</h2>
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => document.getElementById("product-image-upload")?.click()}
                    >
                      <input
                        type="file"
                        id="product-image-upload"
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
                          <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG or WEBP (max. 10MB)</p>
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
                            <li>Product should be clearly visible and centered</li>
                            <li>Simple backgrounds work best for extraction</li>
                            <li>Avoid images with multiple products or complex shadows</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Example Transformations</h2>
                <div className="grid grid-cols-1 gap-6">
                  <ExampleCard
                    title="Fashion Product"
                    description="Transformed from basic studio shot to lifestyle setting with model and natural lighting."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                  />
                  <ExampleCard
                    title="Electronics"
                    description="Enhanced product details with dramatic lighting and tech-inspired environment."
                    before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                    after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-4">
            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <VisualSelect
                        label="Product Category"
                        value={formData.category}
                        onValueChange={(value) => handleInputChange("category", value)}
                        options={productCategories}
                      />

                      <VisualSelect
                        label="Scene Type"
                        value={formData.scene}
                        onValueChange={(value) => handleInputChange("scene", value)}
                        options={productScenes}
                      />

                      <VisualSelect
                        label="Visual Style"
                        value={formData.style}
                        onValueChange={(value) => handleInputChange("style", value)}
                        options={productStyles}
                      />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="lighting-slider">Lighting Intensity</Label>
                          <span className="text-sm text-slate-500">{formData.lightingIntensity}%</span>
                        </div>
                        <Slider
                          id="lighting-slider"
                          min={0}
                          max={100}
                          step={1}
                          value={[formData.lightingIntensity]}
                          onValueChange={(value) => handleInputChange("lightingIntensity", value[0])}
                          className="py-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shadow-slider">Shadow Intensity</Label>
                          <span className="text-sm text-slate-500">{formData.shadowIntensity}%</span>
                        </div>
                        <Slider
                          id="shadow-slider"
                          min={0}
                          max={100}
                          step={1}
                          value={[formData.shadowIntensity]}
                          onValueChange={(value) => handleInputChange("shadowIntensity", value[0])}
                          className="py-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="preserve-colors" className="text-sm font-medium cursor-pointer">
                            Preserve Original Colors
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Keep the original product colors intact
                          </p>
                        </div>
                        <Switch
                          id="preserve-colors"
                          checked={formData.preserveColors}
                          onCheckedChange={(checked) => handleInputChange("preserveColors", checked)}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="enhance-details" className="text-sm font-medium cursor-pointer">
                            Enhance Product Details
                          </Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Improve texture and fine details</p>
                        </div>
                        <Switch
                          id="enhance-details"
                          checked={formData.enhanceDetails}
                          onCheckedChange={(checked) => handleInputChange("enhanceDetails", checked)}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="prompt">Custom Instructions</Label>
                          <Textarea
                            id="prompt"
                            placeholder="Describe how you want your product to look..."
                            value={formData.prompt}
                            onChange={(e) => handleInputChange("prompt", e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="negativePrompt">Elements to Avoid</Label>
                          <Textarea
                            id="negativePrompt"
                            placeholder="Describe elements to avoid in the generation..."
                            value={formData.negativePrompt}
                            onChange={(e) => handleInputChange("negativePrompt", e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium mb-4">Your Product Image</h3>
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded product"
                          className="w-full h-auto object-contain"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                          <Button variant="secondary" size="icon" onClick={handleReset} className="mr-2">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        size="lg"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Transform Product
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <Card className="w-full max-w-2xl mx-auto overflow-hidden">
                <CardContent className="p-6">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px]">
                      <Loader2 className="h-16 w-16 text-purple-600 animate-spin mb-4" />
                      <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                        Transforming your product...
                      </p>
                      <p className="text-sm text-center text-slate-500 dark:text-slate-500 mt-2 max-w-md">
                        Creating a {formData.style} style image with {formData.scene} setting for your{" "}
                        {formData.category} product
                      </p>
                    </div>
                  ) : generatedImage ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Original
                          </p>
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                              src={uploadedImage || "/placeholder.svg"}
                              alt="Original product"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-center mb-2 font-medium text-slate-500 dark:text-slate-400">
                            Transformed
                          </p>
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                              src={generatedImage || "/placeholder.svg"}
                              alt="Transformed product"
                              className="w-full h-auto object-contain"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="secondary" size="icon" className="mr-2">
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
                        <h3 className="font-medium text-sm mb-2">Transformation Details</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Category:</span>
                            <span className="font-medium">
                              {productCategories.find((c) => c.value === formData.category)?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Scene:</span>
                            <span className="font-medium">
                              {productScenes.find((s) => s.value === formData.scene)?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Style:</span>
                            <span className="font-medium">
                              {productStyles.find((s) => s.value === formData.style)?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Lighting:</span>
                            <span className="font-medium">{formData.lightingIntensity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Shadows:</span>
                            <span className="font-medium">{formData.shadowIntensity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Enhanced Details:</span>
                            <span className="font-medium">{formData.enhanceDetails ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button onClick={() => setActiveTab("customize")} variant="outline" className="flex-1">
                          Modify Settings
                        </Button>
                        <Button
                          onClick={handleGenerate}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate New Variation
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[500px]">
                      <p className="text-lg text-center text-slate-600 dark:text-slate-400">
                        Upload and customize your product to see the transformation
                      </p>
                      <Button onClick={() => setActiveTab("upload")} variant="outline" className="mt-4">
                        Go to Upload
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Additional Examples Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            More Transformation Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ExampleCard
              title="Home Decor"
              description="Transform basic product shots into styled room settings that showcase your products in context."
              before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
              after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
            />
            <ExampleCard
              title="Beauty Products"
              description="Create elegant, high-end product photography with luxurious backgrounds and perfect lighting."
              before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
              after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
            />
            <ExampleCard
              title="Food & Beverage"
              description="Generate appetizing product shots with perfect styling and complementary backgrounds."
              before="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
              after="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=300&width=300"
            />
          </div>
        </section>

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
                <h3 className="text-lg font-bold mb-2">1. Upload Your Product</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Upload a high-quality image of your product. For best results, use images with clear lighting and
                  minimal background distractions.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <ImagePlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">2. Customize Settings</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Choose your desired scene, style, and adjust parameters like lighting and shadows. Add custom
                  instructions to get exactly the look you want.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">3. Generate & Download</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Our AI transforms your product image according to your specifications. Download the result or generate
                  new variations until you're satisfied.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

