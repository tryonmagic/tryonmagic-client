"use client";

import { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { X, Download, Maximize } from "lucide-react";
import { CDN_URL, cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { imagePreviewAtom } from "@/app/atom";

interface EnhancedImageProps extends ImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  hideFullscreenPreview?: boolean;
  hideDownload?: boolean;
}

export default function EnhancedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 80,
  hideFullscreenPreview = false,
  hideDownload = false,
  ...props
}: EnhancedImageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [buttonSize, setButtonSize] = useState(36);
  const [iconSize, setIconSize] = useState(18);
  const imageRef = useRef<HTMLDivElement>(null);
  const [, setImagePreview] = useAtom(imagePreviewAtom);

  // Calculate button size based on image dimensions
  useEffect(() => {
    const updateButtonSize = () => {
      if (imageRef.current) {
        const { offsetWidth, offsetHeight } = imageRef.current;
        const minDimension = Math.min(offsetWidth, offsetHeight);

        // Scale button size based on image dimensions
        const newButtonSize = Math.max(32, Math.min(48, minDimension / 8));
        setButtonSize(newButtonSize);
        setIconSize(newButtonSize / 2);
      }
    };

    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);

    return () => {
      window.removeEventListener("resize", updateButtonSize);
    };
  }, []);

  const handleDownload = () => {
    const downloadUrl = `${CDN_URL}?url=${encodeURIComponent(src)}`;
    window.open(downloadUrl, "_blank");
  };

  return (
    <>
      <div
        ref={imageRef}
        className="relative group overflow-hidden rounded-lg"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={quality}
          className={cn(
            "transition-transform duration-300",
            isHovering ? "scale-105" : "scale-100",
            className,
          )}
          {...props}
        />

        {/* Hover overlay with icon buttons */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center gap-4 transition-opacity duration-300",
            isHovering ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {!hideFullscreenPreview && (
            <button
              onClick={() => setImagePreview(src)}
              className="flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
              style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
              aria-label="Preview image"
            >
              <Maximize size={iconSize} />
            </button>
          )}
          {!hideDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
              style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
              aria-label="Download image"
            >
              <Download size={iconSize} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
