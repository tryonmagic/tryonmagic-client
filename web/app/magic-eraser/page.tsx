"use client";

import type React from "react";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Wand2,
  Download,
  Eraser,
  Brush,
  CheckCircle,
  MessageSquare,
  ArrowRightLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
import { AxiosError } from "axios";

export default function MagicEraser() {
  const [uploadedImageInfo, setUploadedImageInfo] = useState<ImageInfo | null>(
    null,
  );
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState("");
  const [editMode, setEditMode] = useState<EditMode>(EditMode.PROMPT);
  const [hoverBoxIdx, setHoverBoxIdx] = useState<number | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const app = useAppBridge();

  const [editType, setEditType] = useState<EditType>(EditType.INPAINT_REMOVE);
  const [replaceFromPrompt, setReplaceFromPrompt] = useState("");
  const [replaceWithPrompt, setReplaceWithPrompt] = useState("");

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

    setActiveTab("edit");
  };

  const handleErase = async () => {
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

      const newTaskPayload: NewTask<EditImageTaskInput> = {
        type: TaskType.EDIT_IMAGE,
        inputData: {
          sourceImageUrl: uploadedImageInfo.uploadLocation,
          imageSourceType: ImageSourceType.URL,
          editType,
          editMode,
          editPrompt: textPrompt,
          editRegion:
            editMode === EditMode.REGION
              ? boxes.map((box) => ({
                  x: Math.round(box.xPct * uploadedImageInfo.width),
                  y: Math.round(box.yPct * uploadedImageInfo.height),
                  width: Math.round(box.wPct * uploadedImageInfo.width),
                  height: Math.round(box.hPct * uploadedImageInfo.height),
                }))
              : undefined,
          replacePrompt:
            editType === EditType.INPAINT_REPLACE
              ? {
                  replaceFrom: replaceFromPrompt.trim() || undefined,
                  replaceTo: replaceWithPrompt.trim(),
                }
              : undefined,
        },
      };

      const response = await newTask<EditImageTaskInput>(
        sessionToken,
        newTaskPayload,
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
            setResultImage(data.resultData.outputImageUrl);
          } else {
            setError("No result image was generated. Please try again.");
          }
        }
        if (data.status === TaskStatus.FAILED) {
          setIsProcessing(false);
          setError(
            "Image editing failed. Please try again with different settings.",
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

  const resetImage = () => {
    setUploadedImageInfo(null);
    setResultImage(null);
    setActiveTab("upload");
    setEditType(EditType.INPAINT_REMOVE);
    setReplaceFromPrompt("");
    setReplaceWithPrompt("");
    setTextPrompt("");
    setBoxes([]);
    setBox(null);
    setError(null); // Clear error on reset
  };

  const handleRetry = () => {
    setError(null); // Clear error
    setResultImage(null);
    setTaskProgress(null);
    setActiveTab("edit"); // Go back to edit tab to adjust settings
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
          Magic Editor
        </h1>
        <p className="text-xl mt-2 text-muted-foreground">
          Remove, replace, or insert objects in your images with AI precision
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="grid grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="edit" disabled={!uploadedImageInfo}>
            Edit
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!resultImage}>
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-8">
          <ImageUploader
            style={{ height: "200px" }}
            onUploaded={onImageUploaded}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                  <ArrowRightLeft className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  Replace Objects
                </h3>
                <p className="text-muted-foreground text-center">
                  Replace any object with something else using AI generation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Brush className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  Insert Objects
                </h3>
                <p className="text-muted-foreground text-center">
                  Add new objects or elements anywhere in your image
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

        <TabsContent value="edit" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-0 relative">
                  {/* Operation Type and Mode switch */}
                  <div className="absolute top-2 left-2 z-10 bg-background/80 rounded px-2 py-1 flex gap-4 items-center">
                    {/* Operation Type Selection */}
                    <div className="flex gap-2 items-center border-r-2 border-r-purple-600 pr-4">
                      <Label
                        htmlFor="operation-erase"
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          id="operation-erase"
                          type="radio"
                          checked={editType === EditType.INPAINT_REMOVE}
                          onChange={() => setEditType(EditType.INPAINT_REMOVE)}
                          className="accent-purple-600"
                        />
                        <Eraser className="h-3 w-3" />
                        Erase
                      </Label>
                      <Label
                        htmlFor="operation-replace"
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          id="operation-replace"
                          type="radio"
                          checked={editType === EditType.INPAINT_REPLACE}
                          onChange={() => setEditType(EditType.INPAINT_REPLACE)}
                          className="accent-purple-600"
                        />
                        <ArrowRightLeft className="h-3 w-3" />
                        Replace
                      </Label>
                      <Label
                        htmlFor="operation-insert"
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          id="operation-insert"
                          type="radio"
                          checked={editType === EditType.INPAINT_INSERTION}
                          onChange={() =>
                            setEditType(EditType.INPAINT_INSERTION)
                          }
                          className="accent-purple-600"
                        />
                        <Brush className="h-3 w-3" />
                        Insert
                      </Label>
                    </div>

                    {/* Mode Selection */}
                    <div className="flex gap-2 items-center">
                      <Label
                        htmlFor="edit-mode-box"
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          id="edit-mode-box"
                          type="radio"
                          checked={editMode === EditMode.REGION}
                          onChange={() => setEditMode(EditMode.REGION)}
                          className="accent-purple-600"
                        />
                        Draw Box
                      </Label>
                      {editType !== EditType.INPAINT_INSERTION && (
                        <Label
                          htmlFor="edit-mode-prompt"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <input
                            id="edit-mode-prompt"
                            type="radio"
                            checked={editMode === EditMode.PROMPT}
                            onChange={() => setEditMode(EditMode.PROMPT)}
                            className="accent-purple-600"
                          />
                          Prompt
                        </Label>
                      )}
                    </div>
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
                      {editType === EditType.INPAINT_REMOVE
                        ? "Eraser Settings"
                        : editType === EditType.INPAINT_REPLACE
                          ? "Replace Settings"
                          : "Insert Settings"}
                    </h3>
                    <div className="space-y-4">
                      {/* Erase mode settings */}
                      {editType === EditType.INPAINT_REMOVE &&
                        editMode === EditMode.REGION && (
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

                      {/* Erase prompt mode settings */}
                      {editType === EditType.INPAINT_REMOVE &&
                        editMode === EditMode.PROMPT && (
                          <div className="space-y-2">
                            <Label htmlFor="erase-prompt-textarea">
                              Describe what to remove
                            </Label>
                            <textarea
                              id="erase-prompt-textarea"
                              className="w-full min-h-[80px] p-2 rounded-md border border-input bg-background"
                              placeholder="E.g., 'boat,bike'"
                              value={textPrompt}
                              onChange={(e) => setTextPrompt(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Describe what you want to remove from the image.
                              You can specify more than one prompt using comma.
                            </p>
                          </div>
                        )}

                      {/* Replace mode settings */}
                      {editType === EditType.INPAINT_REPLACE &&
                        editMode === EditMode.REGION && (
                          <div className="space-y-2">
                            <Label>Select Area to Replace</Label>
                            <p className="text-sm text-muted-foreground">
                              Draw a box over the object you want to replace.
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

                            {/* Replace with prompt for box mode */}
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="replace-box-prompt">
                                Replace with
                              </Label>
                              <textarea
                                id="replace-box-prompt"
                                className="w-full min-h-[60px] p-2 rounded-md border border-input bg-background"
                                placeholder="E.g., 'a red car'"
                                value={textPrompt}
                                onChange={(e) => setTextPrompt(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Describe what you want to replace the selected
                                area with.
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Replace prompt mode settings */}
                      {editType === EditType.INPAINT_REPLACE &&
                        editMode === EditMode.PROMPT && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="replace-from-prompt">
                                Replace this
                              </Label>
                              <input
                                id="replace-from-prompt"
                                type="text"
                                className="w-full p-2 rounded-md border border-input bg-background"
                                placeholder="E.g., 'blue car'"
                                value={replaceFromPrompt}
                                onChange={(e) =>
                                  setReplaceFromPrompt(e.target.value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Describe the object you want to replace.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="replace-with-prompt">
                                With this
                              </Label>
                              <input
                                id="replace-with-prompt"
                                type="text"
                                className="w-full p-2 rounded-md border border-input bg-background"
                                placeholder="E.g., 'red car'"
                                value={replaceWithPrompt}
                                onChange={(e) =>
                                  setReplaceWithPrompt(e.target.value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                Describe what you want to replace it with.
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Insert mode settings */}
                      {editType === EditType.INPAINT_INSERTION &&
                        editMode === EditMode.REGION && (
                          <div className="space-y-2">
                            <Label>Select Area to Insert</Label>
                            <p className="text-sm text-muted-foreground">
                              Draw a box over the area you want to insert
                              content into.
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

                            {/* Insert prompt for box mode */}
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="insert-prompt">
                                Insert prompt
                              </Label>
                              <textarea
                                id="insert-prompt"
                                className="w-full min-h-[60px] p-2 rounded-md border border-input bg-background"
                                placeholder="E.g., 'a red car'"
                                value={textPrompt}
                                onChange={(e) => setTextPrompt(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Describe what you want to insert into the
                                selected area.
                              </p>
                            </div>
                          </div>
                        )}

                      {/* Insert mode note for prompt mode */}
                      {editType === EditType.INPAINT_INSERTION &&
                        editMode === EditMode.PROMPT && (
                          <div className="space-y-2">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-yellow-600" />
                                <h4 className="font-medium text-yellow-800">
                                  Region Mode Required
                                </h4>
                              </div>
                              <p className="text-sm text-yellow-700">
                                Insert operation requires "Draw Box" mode to
                                specify where to add content. Please switch to
                                "Draw Box" mode to use the insert feature.
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                  {/* List of boxes with remove button */}
                  {editMode === EditMode.REGION && boxes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">
                        Selected{" "}
                        {editType === EditType.INPAINT_REMOVE
                          ? "Areas to Erase"
                          : editType === EditType.INPAINT_REPLACE
                            ? "Areas to Replace"
                            : "Areas to Insert"}
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
                        (editType === EditType.INPAINT_REMOVE &&
                        editMode === EditMode.REGION
                          ? boxes.length === 0
                          : editType === EditType.INPAINT_REMOVE &&
                              editMode === EditMode.PROMPT
                            ? textPrompt.trim().length === 0
                            : editType === EditType.INPAINT_REPLACE &&
                                editMode === EditMode.REGION
                              ? boxes.length === 0 ||
                                textPrompt.trim().length === 0
                              : editType === EditType.INPAINT_REPLACE &&
                                  editMode === EditMode.PROMPT
                                ? replaceFromPrompt.trim().length === 0 ||
                                  replaceWithPrompt.trim().length === 0
                                : editType === EditType.INPAINT_INSERTION &&
                                    editMode === EditMode.REGION
                                  ? boxes.length === 0 ||
                                    textPrompt.trim().length === 0
                                  : false)
                      }
                    >
                      {isProcessing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          {editType === EditType.INPAINT_REMOVE ? (
                            <>
                              <Eraser className="mr-2 h-4 w-4" /> Apply Magic
                              Eraser
                            </>
                          ) : editType === EditType.INPAINT_REPLACE ? (
                            <>
                              <ArrowRightLeft className="mr-2 h-4 w-4" /> Apply
                              Magic Replace
                            </>
                          ) : (
                            <>
                              <Brush className="mr-2 h-4 w-4" /> Apply Magic
                              Insert
                            </>
                          )}
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
                  Choose between "Erase" to remove objects, "Replace" to
                  substitute them, or "Insert" to add new content
                </li>
                <li>
                  Select your editing mode: "Draw Box" to select specific areas
                  or "Prompt" for text-based editing
                </li>
                <li>
                  For erasing: Mark areas to remove or describe what to erase
                </li>
                <li>
                  For replacing: Select areas and describe what to replace them
                  with, or specify "replace X with Y"
                </li>
                <li>
                  For inserting: Draw a box where you want to add content and
                  describe what to insert
                </li>
                <li>
                  Click "Apply Magic Eraser", "Apply Magic Replace", or "Apply
                  Magic Insert" to process your image
                </li>
                <li>Fine-tune the result if needed with additional editing</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-8">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
              <p className="text-lg text-center text-muted-foreground">
                Processing your image...
              </p>
              <p className="text-sm text-center text-muted-foreground mt-2">
                This may take a few moments
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
                      Processing Failed
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
                      onClick={resetImage}
                      variant="outline"
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Start Over
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardContent className="p-0">
                    {uploadedImageInfo && (
                      <div className="relative w-full aspect-video bg-checkerboard">
                        <Image
                          src={
                            uploadedImageInfo.previewImageUrl ||
                            "/placeholder.svg"
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
                <Button variant="outline" onClick={() => setActiveTab("edit")}>
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
                      <h4 className="font-medium mb-2">Mark Areas</h4>
                      <p className="text-sm text-muted-foreground">
                        Use selection tools to mark objects to remove, replace,
                        or areas to insert content
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-medium mb-2">Describe Changes</h4>
                      <p className="text-sm text-muted-foreground">
                        Describe what to remove, replace, or insert using
                        natural language prompts
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Wand2 className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-medium mb-2">AI Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Our AI analyzes the content and generates, removes, or
                        replaces objects as requested
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-medium mb-2">Seamless Results</h4>
                      <p className="text-sm text-muted-foreground">
                        Get natural-looking results that blend perfectly with
                        the original image
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
