import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  JPEG_QUALITY,
  MAX_EDGE_PX,
  browserImageTools,
  downscaleImage,
  scaledSize,
} from './downscale-image.js';

const fileOf = (type: string, size = 4 * 1024 * 1024, name = 'photo.jpg'): File => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const toolsFor = (
  width: number,
  height: number,
  blobSize: number | null,
): Parameters<typeof downscaleImage>[1] => ({
  createBitmap: () => Promise.resolve({ width, height }),
  encode: () => Promise.resolve(blobSize === null ? null : new Blob([new Uint8Array(blobSize)])),
});

describe('scaledSize', () => {
  it('leaves an image that is already small enough alone', () => {
    expect(scaledSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(scaledSize(MAX_EDGE_PX, 1000)).toEqual({ width: MAX_EDGE_PX, height: 1000 });
  });

  it('caps the longest edge and keeps the aspect ratio', () => {
    expect(scaledSize(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(scaledSize(3000, 4000)).toEqual({ width: 1500, height: 2000 });
  });
});

describe('downscaleImage', () => {
  it('passes a PDF straight through', async () => {
    const pdf = fileOf('application/pdf', 1024, 'agreement.pdf');
    await expect(downscaleImage(pdf)).resolves.toBe(pdf);
  });

  it('passes a text file straight through', async () => {
    const text = fileOf('text/plain', 1024, 'notes.txt');
    await expect(downscaleImage(text)).resolves.toBe(text);
  });

  it('shrinks an oversized photograph', async () => {
    const photo = fileOf('image/jpeg');
    const result = await downscaleImage(photo, toolsFor(4000, 3000, 400 * 1024));
    expect(result).not.toBe(photo);
    expect(result.size).toBe(400 * 1024);
    expect(result.name).toBe('photo.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('leaves an image that is already small enough alone', async () => {
    const photo = fileOf('image/jpeg', 300 * 1024);
    await expect(downscaleImage(photo, toolsFor(1200, 900, 16))).resolves.toBe(photo);
  });

  it('keeps the original when encoding produces nothing', async () => {
    const photo = fileOf('image/jpeg');
    await expect(downscaleImage(photo, toolsFor(4000, 3000, null))).resolves.toBe(photo);
  });

  it('keeps the original when the result would be no smaller', async () => {
    const photo = fileOf('image/jpeg', 100 * 1024);
    await expect(downscaleImage(photo, toolsFor(4000, 3000, 200 * 1024))).resolves.toBe(photo);
  });

  it('keeps the original when the browser cannot decode it', async () => {
    const photo = fileOf('image/jpeg');
    const failing = {
      createBitmap: () => Promise.reject(new Error('unsupported')),
      encode: vi.fn(),
    };
    // A document that uploads slightly larger beats one that will not upload.
    await expect(downscaleImage(photo, failing)).resolves.toBe(photo);
  });
});

describe('browserImageTools', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('decodes a file with the browser bitmap decoder', async () => {
    const bitmap = { width: 100, height: 50 };
    const createImageBitmap = vi.fn(() => Promise.resolve(bitmap));
    vi.stubGlobal('createImageBitmap', createImageBitmap);

    const file = fileOf('image/jpeg', 10);
    await expect(browserImageTools.createBitmap(file)).resolves.toBe(bitmap);
    expect(createImageBitmap).toHaveBeenCalledWith(file);
  });

  it('draws onto a canvas at the requested size and encodes as JPEG', async () => {
    const drawImage = vi.fn();
    const blob = new Blob([new Uint8Array(8)]);
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (cb: (b: Blob) => void, type: string, quality: number) => {
        expect(type).toBe('image/jpeg');
        expect(quality).toBe(JPEG_QUALITY);
        cb(blob);
      },
    };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);

    const bitmap = { width: 400, height: 200 };
    await expect(browserImageTools.encode(bitmap, 200, 100)).resolves.toBe(blob);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 200, 100);
  });

  it('gives up cleanly when a 2d context is unavailable', async () => {
    const canvas = { width: 0, height: 0, getContext: () => null };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);
    // jsdom has no canvas backend, which is exactly this case.
    await expect(browserImageTools.encode({ width: 10, height: 10 }, 5, 5)).resolves.toBeNull();
  });
});
