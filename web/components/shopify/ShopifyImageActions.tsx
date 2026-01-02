"use client";

import React, { useState } from "react";
import { Download, Upload, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleDownload } from "@/lib/utils";
import { useAppBridge } from "@shopify/app-bridge-react";
import toast from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShopifyImageActionsProps {
  images: string | string[];
  selectedImageIndex?: number;
  className?: string;
  filePrefix: string;
  onActionStart?: () => void;
  onActionEnd?: () => void;
  children?: React.ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShopifyImageActions({
  images,
  selectedImageIndex = 0,
  className,
  filePrefix,
  onActionStart,
  onActionEnd,
  children,
  size = "default",
}: ShopifyImageActionsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const appBridge = useAppBridge();

  const getCurrentImage = () => {
    if (typeof images === "string") return images;
    return images[selectedImageIndex];
  };

  const handleShopifyUpload = async () => {
    const imageUrl = getCurrentImage();
    if (!imageUrl) return;

    setIsUploading(true);
    onActionStart?.();
    const toastId = toast.loading("Uploading to Shopify Files...");

    try {
      const sessionToken = await appBridge.idToken();
      const filename = `tryonmagic-${filePrefix}-${imageUrl.split("myshopify.com_")[1]}`;

      const response = await fetch("/api/shopify/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          url: imageUrl,
          filename,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Successfully uploaded to Shopify Files!", {
        id: toastId,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
      onActionEnd?.();
    }
  };

  const handleAttachToProduct = async () => {
    // Check if shopify global exists
    if (!(window as any).shopify) {
      console.error("Shopify App Bridge not found");
      return;
    }

    const imageUrl = getCurrentImage();
    if (!imageUrl) return;

    let toastId;
    try {
      const selected = await (window as any).shopify.resourcePicker({
        type: "product",
        multiple: false,
      });

      if (!selected) return;

      const product = selected[0];
      if (!product) return;

      setIsUploading(true);
      onActionStart?.();
      toastId = toast.loading(`Attaching to ${product.title}...`);

      const sessionToken = await appBridge.idToken();
      const filename = `ai-generated-${Date.now()}.png`;

      // Extract ID from GraphQL ID (gid://shopify/Product/12345)
      const productId = product.id.split("/").pop();

      const response = await fetch("/api/shopify/product/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          productId,
          image: imageUrl,
          filename,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Attachment failed");
      }

      toast.success(`Attached image to ${product.title}`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Attachment error:", error);
      if (toastId) {
        toast.error(
          error instanceof Error ? error.message : "Failed to attach image",
          { id: toastId },
        );
      }
    } finally {
      setIsUploading(false);
      onActionEnd?.();
    }
  };

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={className}>
      <TooltipProvider>
        <div className="flex flex-row flex-wrap items-center gap-2">
          {children}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleDownload(images)}
                size={size}
                variant="outline"
                className="flex-1 min-w-fit bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-sm"
              >
                <Download className={`mr-2 ${iconSize}`} />
                Download
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download image to your device</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleShopifyUpload}
                disabled={isUploading}
                size={size}
                className="flex-1 min-w-fit bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-none shadow-sm"
              >
                {isUploading ? (
                  <Loader2 className={`mr-2 ${iconSize} animate-spin`} />
                ) : (
                  <Upload className={`mr-2 ${iconSize}`} />
                )}
                Upload to Files
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload this image to Shopify Files</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleAttachToProduct}
                disabled={isUploading}
                size={size}
                className="flex-1 min-w-fit bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none shadow-sm"
              >
                {isUploading ? (
                  <Loader2 className={`mr-2 ${iconSize} animate-spin`} />
                ) : (
                  <Layers className={`mr-2 ${iconSize}`} />
                )}
                Attach to Product
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select a shopify product to attach this image to</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
