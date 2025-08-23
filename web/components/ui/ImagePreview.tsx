"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAtom } from "jotai";
import { imagePreviewAtom } from "@/app/atom";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { cn, handleDownload } from "@/lib/utils";

export function ImagePreview() {
  const [imagePreview, setImagePreview] = useAtom(imagePreviewAtom);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const imageRef = React.useRef<HTMLDivElement>(null);

  // Normalize imagePreview to always be an array
  const images = React.useMemo(() => {
    if (!imagePreview) return [];
    return Array.isArray(imagePreview) ? imagePreview : [imagePreview];
  }, [imagePreview]);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Reset state when dialog opens/closes or image changes
  React.useEffect(() => {
    if (imagePreview) {
      setCurrentIndex(0);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [imagePreview]);

  const goToNext = React.useCallback(() => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [hasMultipleImages, images.length]);

  const goToPrevious = React.useCallback(() => {
    if (hasMultipleImages) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [hasMultipleImages, images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imagePreview) return;

      switch (e.key) {
        case "Escape":
          setImagePreview(null);
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          resetView();
          break;
        case "r":
          e.preventDefault();
          rotateImage();
          break;
      }
    };

    if (imagePreview) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [imagePreview, goToNext, goToPrevious, setImagePreview]);

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 10));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const downloadImage = async () => {
    if (!currentImage) return;
    handleDownload([currentImage]);
  };

  // Mouse/touch handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging || zoom <= 1) return;
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, zoom, dragStart.x, dragStart.y],
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(10, prev * delta)));
  };

  if (!imagePreview) return null;

  return (
    <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
      <DialogContent
        className="max-w-none max-h-none w-full h-full p-0 border-0 bg-black/95 backdrop-blur-sm"
        hideCloseButton
      >
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            {hasMultipleImages && (
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              className="text-white hover:bg-white/20"
              disabled={zoom <= 0.1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              className="text-white hover:bg-white/20"
              disabled={zoom >= 10}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="text-white hover:bg-white/20"
              title="Reset zoom and position"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={rotateImage}
              className="text-white hover:bg-white/20"
              title="Rotate image 90°"
            >
              <RotateCcw
                className="h-4 w-4"
                style={{ transform: "scaleX(-1)" }}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={downloadImage}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImagePreview(null)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation arrows for multiple images */}
        {hasMultipleImages && (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 transition-all duration-200"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 transition-all duration-200"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Image container */}
        <div
          ref={imageRef}
          className={`flex items-center justify-center w-full h-full overflow-hidden ${
            zoom > 1
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-default"
          }`}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          <div
            className="relative transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center",
            }}
          >
            <Image
              src={currentImage}
              alt={`Preview ${currentIndex + 1}`}
              width={800}
              height={600}
              className="max-w-[90vw] max-h-[90vh] object-contain select-none"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "90vw",
                maxHeight: "90vh",
              }}
              priority
            />
          </div>
        </div>

        {/* Image indicator dots for multiple images */}
        {hasMultipleImages && images.length <= 10 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/50 rounded-full backdrop-blur-sm">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === currentIndex
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/75",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 right-4 z-50 text-white/70 text-xs hidden md:block">
          <div className="bg-black/50 rounded px-2 py-1 backdrop-blur-sm">
            ESC: Close • ←→: Navigate • +/-: Zoom • 0: Reset • R: Rotate
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
