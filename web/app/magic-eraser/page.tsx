"use client";

import type React from "react";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Wand2,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Eraser,
  Brush,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function MagicEraser() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [brushSize, setBrushSize] = useState(20);
  const [brushHardness, setBrushHardness] = useState(50);
  const [eraserMode, setEraserMode] = useState("smart");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textPrompt, setTextPrompt] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e && e.target) {
          setUploadedImage(e.target.result as string);
          setActiveTab("erase");
        }
      };
      reader.onerror = () => {
        console.error("Error reading file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleErase = () => {
    setIsProcessing(true);

    // Log what's being erased based on mode
    if (eraserMode === "promptErase") {
      console.log(`Using text prompt to remove: "${textPrompt}"`);
    } else {
      console.log(`Using ${eraserMode} eraser mode`);
    }

    // Simulate processing time
    setTimeout(() => {
      // In a real app, this would be where the AI processing happens
      setResultImage(uploadedImage); // For demo, just use the original image
      setIsProcessing(false);
      setActiveTab("result");
    }, 2000);
  };

  const resetImage = () => {
    setUploadedImage(null);
    setResultImage(null);
    setActiveTab("upload");
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
          Magic Eraser
        </h1>
        <p className="text-xl mt-2 text-muted-foreground">
          Remove unwanted objects from your images with AI precision
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="grid grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="erase" disabled={!uploadedImage}>
            Erase
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!resultImage}>
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-8">
          <Card
            className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Upload className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Upload Your Image</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Drag and drop your image here, or click to browse
              </p>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button size="lg" className="relative z-10">
                  <Upload className="mr-2 h-4 w-4" /> Select Image
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Eraser className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  Remove Objects
                </h3>
                <p className="text-muted-foreground text-center">
                  Erase people, text, watermarks, or any unwanted elements
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  Smart Fill
                </h3>
                <p className="text-muted-foreground text-center">
                  AI automatically fills the erased areas with matching content
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  Perfect Results
                </h3>
                <p className="text-muted-foreground text-center">
                  Get professional-quality edits without complex software
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              Example Transformations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=400&width=600"
                    alt="Original image with unwanted object"
                    width={600}
                    height={400}
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-background/80 text-foreground px-2 py-1 rounded text-sm">
                    Before
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Image with unwanted objects
                </p>
              </div>
              <div className="space-y-2">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src="https://ig89yd5z8iykrgxva.lite.vusercontent.net/placeholder.svg?height=400&width=600"
                    alt="Clean image after magic eraser"
                    width={600}
                    height={400}
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-background/80 text-foreground px-2 py-1 rounded text-sm">
                    After
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Clean image after using Magic Eraser
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="erase" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-0 relative">
                  {uploadedImage && (
                    <div className="relative w-full aspect-video bg-checkerboard">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Image to edit"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <Button size="icon" variant="secondary">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-4 left-4 flex space-x-2">
                        <Button size="icon" variant="secondary">
                          <Undo className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary">
                          <Redo className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-center mt-4 space-x-2">
                <Button variant="outline" size="icon">
                  <MousePointer className="h-4 w-4" />
                </Button>
                <Button variant="default" size="icon">
                  <Eraser className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Brush className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Eraser Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Brush Size: {brushSize}px</Label>
                        </div>
                        <Slider
                          value={[brushSize]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(value) => setBrushSize(value[0])}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Brush Hardness: {brushHardness}%</Label>
                        </div>
                        <Slider
                          value={[brushHardness]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setBrushHardness(value[0])}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Eraser Mode</h3>
                    <RadioGroup
                      value={eraserMode}
                      onValueChange={setEraserMode}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="smart" id="smart" />
                        <Label htmlFor="smart">Smart (AI-powered)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="content-aware"
                          id="content-aware"
                        />
                        <Label htmlFor="content-aware">
                          Content-Aware Fill
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transparent" id="transparent" />
                        <Label htmlFor="transparent">Transparent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="promptErase" id="promptErase" />
                        <Label htmlFor="promptErase">Text Prompt</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {eraserMode === "promptErase" && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      <Label htmlFor="text-prompt">
                        Describe what to remove
                      </Label>
                      <textarea
                        id="text-prompt"
                        className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background"
                        placeholder="E.g., 'Remove the person on the right' or 'Erase the trash can in the corner'"
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Be specific about what you want to remove. The AI will
                        automatically detect and erase the described objects.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Advanced Options</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="preserve-edges">Preserve Edges</Label>
                      <Switch id="preserve-edges" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="texture-matching">Texture Matching</Label>
                      <Switch id="texture-matching" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shadow-detection">Shadow Detection</Label>
                      <Switch id="shadow-detection" defaultChecked />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleErase}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" /> Apply Magic Eraser
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">How to Use</h3>
              <ol className="space-y-2 ml-6 list-decimal">
                <li>
                  Use the eraser tool to mark the areas you want to remove
                </li>
                <li>
                  Adjust the brush size and hardness for precise selection
                </li>
                <li>Choose the appropriate eraser mode for your needs</li>
                <li>Click "Apply Magic Eraser" to process your image</li>
                <li>Fine-tune the result if needed with additional erasing</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-0">
                {uploadedImage && (
                  <div className="relative w-full aspect-video bg-checkerboard">
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Original image"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-background/80 text-foreground px-2 py-1 rounded text-sm">
                      Original
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                {resultImage && (
                  <div className="relative w-full aspect-video bg-checkerboard">
                    <img
                      src={resultImage || "/placeholder.svg"}
                      alt="Result image"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-background/80 text-foreground px-2 py-1 rounded text-sm">
                      Result
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => setActiveTab("erase")}>
              <Eraser className="mr-2 h-4 w-4" /> Continue Editing
            </Button>
            <Button variant="default">
              <Download className="mr-2 h-4 w-4" /> Download Result
            </Button>
            <Button variant="outline" onClick={resetImage}>
              <Upload className="mr-2 h-4 w-4" /> Upload New Image
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Eraser className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Mark Objects</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the eraser tool to mark unwanted objects or areas in
                    your image
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Text Prompts</h4>
                  <p className="text-sm text-muted-foreground">
                    Or simply describe what you want to remove using natural
                    language
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Wand2 className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">AI Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes the surrounding content to understand the
                    context
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-medium mb-2">Seamless Results</h4>
                  <p className="text-sm text-muted-foreground">
                    The AI fills in the removed areas with content that matches
                    the surroundings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Perfect For</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Removing Photobombers</h4>
                  <p className="text-sm text-muted-foreground">
                    Get rid of strangers who wandered into your perfect shot
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Cleaning Up Photos</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove trash, power lines, or other distracting elements
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">
                    Removing Text & Watermarks
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Clean up images by removing text overlays or watermarks
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Product Photography</h4>
                  <p className="text-sm text-muted-foreground">
                    Create clean, professional product images by removing
                    imperfections
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
