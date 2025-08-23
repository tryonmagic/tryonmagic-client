"use client"; // Or your framework's equivalent for client-side rendering

import * as React from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"; // Adjust import path
import Image, { ImageProps } from "next/image"; // Or your preferred image component
import Zoom from "react-medium-image-zoom"; // Example from react-medium-image-zoom
import "react-medium-image-zoom/dist/styles.css"; // Import styles

interface ImagePreviewProps extends ImageProps {
  src: string;
  alt: string;
}

export function ImagePreview({ src, alt, ...props }: ImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Image
          src={src}
          alt={alt}
          width={300}
          height={200}
          className="cursor-pointer"
          {...props}
        />
      </DialogTrigger>
      <DialogContent className="max-w-screen max-h-screen overflow-auto">
        <Zoom>
          <Image
            src={src}
            alt={alt}
            fill // Use fill to take up space in the zoomable container
            className="object-contain" // Ensure the image scales properly
            {...props}
          />
        </Zoom>
      </DialogContent>
    </Dialog>
  );
}
