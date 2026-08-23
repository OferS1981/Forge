import { analysePixels, type ImageStats } from '@forge/catalog';

/**
 * The browser half of Reverse Forge: draw the picture small, read the pixels back, and hand them
 * to the catalogue, which does the arithmetic. Nothing leaves the page.
 */
const SAMPLE = 200;

export async function measureImage(file: File): Promise<{ stats: ImageStats; url: string }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await load(url);
    const scale = Math.min(1, SAMPLE / Math.max(image.width, image.height));
    const w = Math.max(1, Math.round(image.width * scale));
    const h = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('This browser would not give Forge a canvas to measure with.');
    ctx.drawImage(image, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    return { stats: analysePixels(data, w, h, image.width, image.height), url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('That file could not be read as an image. Try a PNG, JPEG or WebP.'));
    };
    image.src = url;
  });
}

export async function readText(file: File): Promise<string> {
  return file.text();
}

export const IMAGE_TYPES = 'image/*';
export const TEXT_TYPES = '.txt,.md,.json,.csv,.yaml,.yml';
