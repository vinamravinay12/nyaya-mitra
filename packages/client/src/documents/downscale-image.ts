/** Above this, a photo carries far more pixels than the text in it needs. */
export const MAX_EDGE_PX = 2000;
export const JPEG_QUALITY = 0.85;

export interface ImageTools {
  readonly createBitmap: (file: File) => Promise<{ width: number; height: number }>;
  readonly encode: (
    bitmap: { width: number; height: number },
    width: number,
    height: number,
  ) => Promise<Blob | null>;
}

/** Longest edge capped, aspect preserved. */
export function scaledSize(
  width: number,
  height: number,
  maxEdge = MAX_EDGE_PX,
): { readonly width: number; readonly height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const ratio = maxEdge / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export const browserImageTools: ImageTools = {
  createBitmap: (file) => globalThis.createImageBitmap(file),
  encode: async (bitmap, width, height) => {
    const canvas = globalThis.document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context === null) {
      return null;
    }
    context.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
    });
  },
};

/**
 * Shrinks an oversized photograph before it is uploaded.
 *
 * A phone photo of an agreement is several megabytes of pixels carrying a page
 * of text. Capping the longest edge cuts the upload by roughly three quarters
 * while leaving the text comfortably legible — it is the difference between
 * sending a 4 MB file and a 400 KB one.
 *
 * Every failure path returns the original file. A document that uploads slightly
 * larger is far better than one that will not upload at all.
 */
export async function downscaleImage(file: File, tools = browserImageTools): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  try {
    const bitmap = await tools.createBitmap(file);
    const { width, height } = scaledSize(bitmap.width, bitmap.height);
    if (width === bitmap.width && height === bitmap.height) {
      return file;
    }
    const blob = await tools.encode(bitmap, width, height);
    if (blob === null || blob.size >= file.size) {
      return file;
    }
    return new File([blob], file.name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
