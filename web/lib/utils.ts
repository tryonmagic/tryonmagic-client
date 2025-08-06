import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export const handleDownload = (images: string[]) => {
  images.forEach((image) => {
    const downloadUrl = `${CDN_URL}?url=${encodeURIComponent(image)}`;
    window.open(downloadUrl, "_blank");
  });
};

export const CDN_URL = "api/images";
