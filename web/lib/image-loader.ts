"use client";
const imageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  return `${process.env.NEXT_PUBLIC_IMAGE_PROXY_URL}/images?url=${encodeURIComponent(
    src,
  )}&w=${width}&q=${quality || 75}`;
};

module.exports = imageLoader;
