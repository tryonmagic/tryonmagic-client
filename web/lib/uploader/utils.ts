import { rgbaToThumbHash } from "./thumbhash";

export const generateThumbHash = async (file: File) => {
  const objectURL = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectURL;

    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const scale = 100 / Math.max(image.naturalWidth, image.naturalHeight);
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalWidth * scale);
    context?.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pixels = context?.getImageData(0, 0, canvas.width, canvas.height);

    const binaryThumbHash = rgbaToThumbHash(
      pixels!.width,
      pixels!.height,
      pixels!.data,
    );
    // const placeholderURL = thumbHashToDataURL(binaryThumbHash);
    const imageInfo: {
      width: number;
      height: number;
      thumbHash?: number[];
    } = {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    if (binaryThumbHash) {
      imageInfo.thumbHash = Array.from(binaryThumbHash);
    }
    return imageInfo;
  } finally {
    URL.revokeObjectURL(objectURL);
  }
};
