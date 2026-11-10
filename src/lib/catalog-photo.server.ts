import { createHash } from "node:crypto";
import { MAX_PHOTO_BYTES } from "./photo-limits.ts";

export async function readCatalogPhoto(file: File) {
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    throw new Error("La photo est trop lourde. Choisissez une photo plus petite.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  // Only our compressed raster formats; never SVG/HTML or a MIME label alone.
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  const contentType = jpeg ? "image/jpeg" : webp ? "image/webp" : null;
  if (!contentType || file.type !== contentType) {
    throw new Error("Format de photo non valide. Choisissez un JPG, PNG ou WebP dans le formulaire.");
  }
  const id = createHash("sha256").update(bytes).digest("hex");
  return { id, bytes, contentType, imageUrl: `/media/${id}` };
}
