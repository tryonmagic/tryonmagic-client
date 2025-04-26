"use client";

import { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { X, Download, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedImageProps extends ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}

export default function EnhancedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 80,
  ...props
}: EnhancedImageProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [buttonSize, setButtonSize] = useState(36);
  const [iconSize, setIconSize] = useState(18);
  const imageRef = useRef<HTMLDivElement>(null);

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
    const link = document.createElement("a");
    link.href = `${process.env.NEXT_PUBLIC_IMAGE_PROXY_URL}?url=${encodeURIComponent(
      src,
    )}`;
    link.download = alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
            aria-label="Preview image"
          >
            <Maximize size={iconSize} />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
            aria-label="Download image"
          >
            <Download size={iconSize} />
          </button>
        </div>
      </div>

      {/* Fullscreen preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            style={{ width: "48px", height: "48px" }}
            aria-label="Close preview"
          >
            <X size={24} className="text-white" />
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={src || "/placeholder.svg"}
              alt={alt}
              width={width * 2}
              height={height * 2}
              className="object-contain max-h-[90vh]"
              priority={true}
              quality={100}
            />

            <button
              onClick={handleDownload}
              className="absolute bottom-4 right-4 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
              style={{ width: "48px", height: "48px" }}
              aria-label="Download image"
            >
              <Download size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
