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
  return `https://cdn.tryonmagic.com/images?url=${encodeURIComponent(
    src,
  )}&w=${width}&q=${quality || 75}`;
};

module.exports = imageLoader;
