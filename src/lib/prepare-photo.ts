import { MAX_PHOTO_BYTES, MAX_PHOTO_EDGE, MAX_SOURCE_PHOTO_BYTES } from "./photo-limits";

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Impossible de préparer la photo."));
      },
      "image/webp",
      quality,
    );
  });
}

/** Resize before upload. Only the selected photo is sent, as binary FormData. */
export async function preparePhoto(file: File): Promise<File> {
  if (file.type && !file.type.startsWith("image/")) throw new Error("Choisissez une photo.");
  if (file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error("Choisissez une photo de moins de 20 Mo.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Cette photo n'a pas pu être lue. Essayez un JPG, PNG ou WebP.");
  }
  try {
    if (bitmap.width * bitmap.height > 60_000_000) {
      throw new Error("Cette photo est trop grande. Choisissez une version plus petite.");
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer la photo.");
    for (const edge of [MAX_PHOTO_EDGE, 1024, 800]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.8, 0.65, 0.5]) {
        const blob = await encode(canvas, quality);
        if (blob.size <= MAX_PHOTO_BYTES && ["image/webp", "image/jpeg"].includes(blob.type)) {
          return new File([blob], blob.type === "image/webp" ? "creation.webp" : "creation.jpg", {
            type: blob.type,
          });
        }
      }
    }
    throw new Error("Cette photo reste trop lourde. Choisissez-en une autre.");
  } finally {
    bitmap.close();
  }
}
