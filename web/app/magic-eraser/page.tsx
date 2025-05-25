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
import {
  EditImageTaskInput,
  EditMode,
  EditType,
  ImageSourceType,
  NewTask,
  TaskProgress,
  TaskStatus,
  TaskType,
} from "@/lib/api/type";
import { useAppBridge } from "@shopify/app-bridge-react";
import ImageUploader, {
  ImageInfo,
} from "@/lib/uploader/components/ImageUploader";
import { WebSocketClient } from "@/socket";
import { newTask } from "@/lib/api/tasks";

export default function MagicEraser() {
  const [uploadedImageInfo, setUploadedImageInfo] = useState<ImageInfo | null>(
    null,
  );
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [textPrompt, setTextPrompt] = useState("");
  const [editMode, setEditMode] = useState<EditMode>(EditMode.PROMPT);
  const [hoverBoxIdx, setHoverBoxIdx] = useState<number | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const app = useAppBridge();

  const [boxes, setBoxes] = useState<
    { xPct: number; yPct: number; wPct: number; hPct: number }[]
  >([]);
  const [box, setBox] = useState<{
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{
    xPct: number;
    yPct: number;
  } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const onImageUploaded = (imageInfo: ImageInfo) => {
    setUploadedImageInfo(imageInfo);

    setActiveTab("erase");
  };

  const handleErase = async () => {
    if (!uploadedImageInfo) return;
    setIsProcessing(true);

    const sessionToken = await app.idToken();

    const newTaskPayload: NewTask<EditImageTaskInput> = {
      type: TaskType.EDIT_IMAGE,
      inputData: {
        sourceImageUrl: uploadedImageInfo.uploadLocation,
        imageSourceType: ImageSourceType.URL,
        editType: EditType.INPAINT_REMOVE,
        editMode,
        editPrompt: textPrompt,
        editRegion: boxes.map(box => ({
          x: Math.round(box.xPct * uploadedImageInfo.width),
          y: Math.round(box.yPct * uploadedImageInfo.height),
          width: Math.round(box.wPct * uploadedImageInfo.width),
          height: Math.round(box.hPct * uploadedImageInfo.height)
        })),
      },
    };

    const response = await newTask<EditImageTaskInput>(
      sessionToken,
      newTaskPayload,
    );
    const task = response.data.data;
    if (!task) {
      console.error("No task data returned");
      return;
    }
    const websocket = new WebSocketClient(task.userId);
    websocket.on<TaskProgress>("task-progress", async (data) => {
      console.log("WebSocket data received:", data);
      setTaskProgress(data);
      if (data.status === TaskStatus.SUCCEEDED) {
        setIsProcessing(false);
        setActiveTab("result");
        if (data.resultData?.outputImageUrl) {
          setResultImage(data.resultData.outputImageUrl);
        }
      }
    });
  };

  const resetImage = () => {
    setUploadedImageInfo(null);
    setResultImage(null);
    setActiveTab("upload");
  };

  // Helper to get mouse position as percentage of image
  const getRelativePosition = (e: React.MouseEvent) => {
    const img = imageRef.current;
    if (!img) return { xPct: 0, yPct: 0 };
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Clamp to image bounds
    const xClamped = Math.max(0, Math.min(x, rect.width));
    const yClamped = Math.max(0, Math.min(y, rect.height));
    return {
      xPct: xClamped / rect.width,
      yPct: yClamped / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!uploadedImageInfo) return;
    const { xPct, yPct } = getRelativePosition(e);
    setStartPoint({ xPct, yPct });
    setBox(null);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const { xPct, yPct } = getRelativePosition(e);
    const x1 = startPoint.xPct;
    const y1 = startPoint.yPct;
    const x2 = xPct;
    const y2 = yPct;
    setBox({
      xPct: Math.min(x1, x2),
      yPct: Math.min(y1, y2),
      wPct: Math.abs(x2 - x1),
      hPct: Math.abs(y2 - y1),
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Add current box to boxes list
  const handleAddBox = () => {
    if (box && box.wPct > 0 && box.hPct > 0) {
      setBoxes((prev) => [...prev, box]);
      setBox(null);
    }
  };

  // Remove box by index
  const handleRemoveBox = (idx: number) => {
    setBoxes((prev) => prev.filter((_, i) => i !== idx));
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
          <TabsTrigger value="erase" disabled={!uploadedImageInfo}>
            Erase
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!resultImage}>
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-8">
          <ImageUploader onUploaded={onImageUploaded} />

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
                  {/* Mode switch */}
                  <div className="absolute top-2 left-2 z-10 bg-background/80 rounded px-2 py-1 flex gap-2 items-center">
                    <Label
                      htmlFor="erase-mode-box"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <input
                        id="erase-mode-box"
                        type="radio"
                        checked={editMode === EditMode.REGION}
                        onChange={() => setEditMode(EditMode.REGION)}
                        className="accent-purple-600"
                      />
                      Draw Box
                    </Label>
                    <Label
                      htmlFor="erase-mode-prompt"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <input
                        id="erase-mode-prompt"
                        type="radio"
                        checked={editMode === EditMode.PROMPT}
                        onChange={() => setEditMode(EditMode.PROMPT)}
                        className="accent-purple-600"
                      />
                      Prompt
                    </Label>
                  </div>
                  {uploadedImageInfo && editMode === EditMode.REGION && (
                    <div
                      className="relative w-full bg-checkerboard"
                      ref={imageContainerRef}
                      style={{ cursor: "crosshair" }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      <Image
                        ref={imageRef}
                        src={
                          uploadedImageInfo.previewImageUrl ||
                          "/placeholder.svg"
                        }
                        alt="Image to edit"
                        width={600}
                        height={400}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        draggable={false}
                      />
                      {/* Render all boxes */}
                      {boxes.map((b, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "absolute",
                            left: `${b.xPct * 100}%`,
                            top: `${b.yPct * 100}%`,
                            width: `${b.wPct * 100}%`,
                            height: `${b.hPct * 100}%`,
                            border: "2px solid #a855f7",
                            background: "rgba(168,85,247,0.15)",
                            pointerEvents: "none",
                            zIndex: hoverBoxIdx === idx ? 20 : 10,
                            boxShadow:
                              hoverBoxIdx === idx
                                ? "0 0 0 2px #73FFB5"
                                : undefined,
                            borderColor:
                              hoverBoxIdx === idx ? "#73FFB5" : "#a855f7",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                          }}
                        />
                      ))}
                      {/* Render hovered box highlight */}
                      {hoverBoxIdx !== null && boxes[hoverBoxIdx] && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${boxes[hoverBoxIdx].xPct * 100}%`,
                            top: `${boxes[hoverBoxIdx].yPct * 100}%`,
                            width: `${boxes[hoverBoxIdx].wPct * 100}%`,
                            height: `${boxes[hoverBoxIdx].hPct * 100}%`,
                            border: "2px solid #73FFB5",
                            background: "rgba(245,158,66,0.15)",
                            pointerEvents: "none",
                            zIndex: 30,
                            boxShadow: "0 0 0 4px #73FFB555",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                          }}
                        />
                      )}
                      {/* Render current drawing box */}
                      {box && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${box.xPct * 100}%`,
                            top: `${box.yPct * 100}%`,
                            width: `${box.wPct * 100}%`,
                            height: `${box.hPct * 100}%`,
                            border: "2px dashed #a855f7",
                            background: "rgba(168,85,247,0.1)",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </div>
                  )}
                  {uploadedImageInfo && editMode === EditMode.PROMPT && (
                    <div className="flex items-center justify-center w-full bg-checkerboard">
                      <Image
                        ref={imageRef}
                        src={
                          uploadedImageInfo.previewImageUrl ||
                          "/placeholder.svg"
                        }
                        alt="Image to edit"
                        width={600}
                        height={400}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Eraser Settings
                    </h3>
                    <div className="space-y-4">
                      {/* Box mode settings */}
                      {editMode === EditMode.REGION && (
                        <div className="space-y-2">
                          <Label>Select Area to Erase</Label>
                          <p className="text-sm text-muted-foreground">
                            Draw a box over the object you want to remove.
                          </p>
                          {/* Add Box Button */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleAddBox}
                              disabled={
                                !box || box.wPct === 0 || box.hPct === 0
                              }
                            >
                              Add Box
                            </Button>
                            {box && uploadedImageInfo && (
                              <span className="text-xs text-muted-foreground">
                                {(() => {
                                  const img = uploadedImageInfo;
                                  const x = Math.round(box.xPct * img.width);
                                  const y = Math.round(box.yPct * img.height);
                                  const w = Math.round(box.wPct * img.width);
                                  const h = Math.round(box.hPct * img.height);
                                  return (
                                    <>
                                      Preview: x={x}, y={y}, w={w}, h={h}
                                    </>
                                  );
                                })()}
                              </span>
                            )}
                          </div>
                          {(!box || !imageRef.current) && (
                            <div className="text-xs text-muted-foreground">
                              Click and drag on the image to select an area.
                            </div>
                          )}
                        </div>
                      )}
                      {/* Prompt mode settings */}
                      {editMode === EditMode.PROMPT && (
                        <div className="space-y-2">
                          <Label htmlFor="prompt-textarea">
                            Describe what to remove
                          </Label>
                          <textarea
                            id="prompt-textarea"
                            className="w-full min-h-[80px] p-2 rounded-md border border-input bg-background"
                            placeholder="E.g., 'boat,bike'"
                            value={textPrompt}
                            onChange={(e) => setTextPrompt(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Describe what you want to remove from the image. You
                            can specify more than one prompt using comma.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* List of boxes with remove button */}
                  {editMode === EditMode.REGION && boxes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">
                        Selected Boxes
                      </h4>
                      <ul className="space-y-2">
                        {boxes.map((b, idx) => {
                          let x = 0,
                            y = 0,
                            w = 0,
                            h = 0;
                          if (uploadedImageInfo) {
                            x = Math.round(b.xPct * uploadedImageInfo.width);
                            y = Math.round(b.yPct * uploadedImageInfo.height);
                            w = Math.round(b.wPct * uploadedImageInfo.width);
                            h = Math.round(b.hPct * uploadedImageInfo.height);
                          }
                          return (
                            <li
                              key={idx}
                              className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded hover:bg-muted hover:border hover:border-muted-foreground/50 transition-colors"
                              onMouseEnter={() => setHoverBoxIdx(idx)}
                              onMouseLeave={() => setHoverBoxIdx(null)}
                            >
                              <span className="text-xs">
                                x={x}, y={y}, w={w}, h={h}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveBox(idx)}
                                aria-label="Remove box"
                              >
                                ×
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleErase}
                      disabled={
                        isProcessing ||
                        (editMode === EditMode.REGION
                          ? boxes.length === 0
                          : textPrompt.trim().length === 0)
                      }
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
                {uploadedImageInfo && (
                  <div className="relative w-full aspect-video bg-checkerboard">
                    <Image
                      src={
                        uploadedImageInfo.previewImageUrl || "/placeholder.svg"
                      }
                      alt="Original image"
                      width={600}
                      height={400}
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
                    <Image
                      src={resultImage || "/placeholder.svg"}
                      alt="Result image"
                      width={600}
                      height={400}
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
