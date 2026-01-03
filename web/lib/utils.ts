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
import { SubscriptionPlan } from "@/app/purchase/type";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/app/api/images/service";

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
    default:
      return Sparkles;
  }
};

export const getSubscriptionPlan = (planName: string) => {
  const normalizedName = planName.toUpperCase();

  if (normalizedName.includes("PRO")) {
    return SubscriptionPlan.ENTERPRISE;
  } else if (normalizedName.includes("GROWTH")) {
    return SubscriptionPlan.PRO;
  } else if (normalizedName.includes("STARTER")) {
    return SubscriptionPlan.BASIC;
  }

  return SubscriptionPlan.FREE;
};

export const getSubscriptionPlanName = (plan: SubscriptionPlan) => {
  switch (plan) {
    case SubscriptionPlan.ENTERPRISE:
      return "Pro";
    case SubscriptionPlan.PRO:
      return "Growth";
    case SubscriptionPlan.BASIC:
      return "Starter";
    default:
      return "Free";
  }
};

export const getImageFetchUrl = async (imageUrl: string) => {
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }
  const urlWithBucket = imageUrl?.replace("s3://", "").split("/");
  if (!urlWithBucket) {
    throw new Error("Invalid URL");
  }
  const Bucket = urlWithBucket.shift();
  const Key = urlWithBucket.join("/");
  const filename = Key.split("/").pop(); // Extract just the filename
  const ext = filename?.split(".").pop()?.toLowerCase();

  let contentType = "image/png";
  if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
  if (ext === "webp") contentType = "image/webp";

  // Set signed URL to expire in 12 hours (43200 seconds)
  // Also, set cache headers to allow client caching for 12 hours
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
    ResponseContentType: contentType,
    ResponseCacheControl: "public, max-age=43200, immutable",
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60 * 12,
  });
  return url;
};
