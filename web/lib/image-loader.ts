"use client";

import { CDN_URL } from "./utils";

const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  return `${CDN_URL}?url=${encodeURIComponent(
    src,
  )}&w=${width}&q=${quality || 75}`;
};

module.exports = imageLoader;
