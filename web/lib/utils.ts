import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskType } from "./api/type";
import {
  Eraser,
  ImagePlus,
  Maximize,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCamelCase(str: string) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

export default function debounce(func: (...args: any[]) => void, wait = 166) {
  let timeout: NodeJS.Timeout;
  function debounced(...args: any[]) {
    const later = () => {
      // @ts-ignore
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }
  debounced.clear = () => {
    clearTimeout(timeout);
  };
  return debounced;
}

export const handleDownload = (images: string | string[]) => {
  if (!images) return;
  if (typeof images === "string") {
    const downloadUrl = `${CDN_URL}?url=${encodeURIComponent(images)}`;
    window.open(downloadUrl, "_blank");
    return;
  }
  images.forEach((image) => {
    const downloadUrl = `${CDN_URL}?url=${encodeURIComponent(image)}`;
    window.open(downloadUrl, "_blank");
  });
};

export const CDN_URL = "api/images";

export const getStatusText = (status: string) => {
  switch (status) {
    case "SUCCEEDED":
      return "Completed";
    case "PROCESSING":
      return "Processing";
    case "QUEUED":
      return "Queued";
    case "PENDING":
      return "Pending";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "SUCCEEDED":
      return "default"; // Green
    case "PROCESSING":
    case "QUEUED":
      return "secondary"; // Blue/Gray
    case "PENDING":
      return "outline"; // White with border
    case "FAILED":
      return "destructive"; // Red
    default:
      return "outline";
  }
};

// Get tool-specific icon
type ToolType = TaskType | string;

export const getToolIcon = (type: ToolType) => {
  // Support both enum and string values
  switch (type) {
    case TaskType.REMOVE_BACKGROUND:
    case "REMOVE_BACKGROUND":
    case "Remove Background":
      return Eraser;
    case TaskType.GENERATE_AI_MODEL:
    case "GENERATE_AI_MODEL":
    case "Generate AI Model":
      return ImagePlus;
    case TaskType.VTON:
    case "VTON":
    case "V-Toning":
      return User;
    case TaskType.UPSCALE:
    case "UPSCALE":
    case "Upscale":
      return Wand2;
    case TaskType.ENHANCE:
    case "ENHANCE":
    case "Enhance":
      return Wand2;
    case TaskType.EXPAND_IMAGE:
    case "EXPAND_IMAGE":
    case "Expand Image":
      return Maximize;
    case TaskType.EDIT_IMAGE:
    case "EDIT_IMAGE":
    case "Edit Image":
      return Sparkles;
    case TaskType.PRODUCT_IMAGE_EDITING:
    case "PRODUCT_IMAGE_EDITING":
    case "Product Image Editing":
      return Sparkles;
    case TaskType.REPLACE_BACKGROUND:
    case "REPLACE_BACKGROUND":
    case "Replace Background":
      return Eraser;
    case TaskType.GENERATE_IMAGE:
    case "GENERATE_IMAGE":
    case "Generate Image":
      return ImagePlus;
    default:
      return Sparkles;
  }
};


