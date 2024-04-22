export type InputImages = {
  imageType?: "color" | "grayscale";
  image?: HTMLImageElement;
  paletteImage?: HTMLImageElement;
  imageError?: string;
};

export function resolveSingleErrorMessage(
  images: InputImages
): string | undefined {
  if (images.imageError) {
    return images.imageError;
  } else if (!images.image) {
    return "Missing image file";
  } else if (images.imageType == "grayscale" && !images.paletteImage) {
    return "Missing palette file";
  }
}
