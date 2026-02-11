import { removeBackground } from '@imgly/background-removal';

/**
 * AI-powered background removal using ML model
 * Processes a single frame and returns the result with transparent background
 */
export async function removeBackgroundAI(imageData: ImageData): Promise<ImageData> {
  // Create a temporary canvas with the image data
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);

  // Convert canvas to blob for processing
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to convert canvas to blob'));
    });
  });

  // Remove background using AI
  const result = await removeBackground(blob);

  // Convert result back to ImageData
  const resultImage = new Image();
  const resultUrl = URL.createObjectURL(result);

  return new Promise((resolve, reject) => {
    resultImage.onload = () => {
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = imageData.width;
      resultCanvas.height = imageData.height;
      const resultCtx = resultCanvas.getContext('2d');

      if (!resultCtx) {
        reject(new Error('Could not get result canvas context'));
        return;
      }

      resultCtx.drawImage(resultImage, 0, 0);
      const resultImageData = resultCtx.getImageData(0, 0, imageData.width, imageData.height);

      URL.revokeObjectURL(resultUrl);
      resolve(resultImageData);
    };

    resultImage.onerror = () => {
      URL.revokeObjectURL(resultUrl);
      reject(new Error('Failed to load result image'));
    };

    resultImage.src = resultUrl;
  });
}

/**
 * Magic wand selection - selects similar colors
 * Returns a mask where selected pixels are white (255) and unselected are black (0)
 */
export function magicWandSelect(
  imageData: ImageData,
  x: number,
  y: number,
  tolerance: number = 32
): Uint8ClampedArray {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const mask = new Uint8ClampedArray(width * height);

  // Get the target color at clicked position
  const startIndex = (y * width + x) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];

  // Flood fill algorithm
  const stack: [number, number][] = [[x, y]];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const pixelIndex = cy * width + cx;

    if (visited.has(pixelIndex)) continue;
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

    visited.add(pixelIndex);

    const dataIndex = pixelIndex * 4;
    const r = data[dataIndex];
    const g = data[dataIndex + 1];
    const b = data[dataIndex + 2];

    // Check if color is within tolerance
    const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);

    if (diff <= tolerance * 3) {
      mask[pixelIndex] = 255; // Mark as selected

      // Add neighbors to stack
      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }
  }

  return mask;
}

/**
 * Apply a selection mask to remove background
 * Pixels where mask is 255 (white) will be made transparent
 */
export function applyMaskToRemoveBackground(
  imageData: ImageData,
  mask: Uint8ClampedArray
): ImageData {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Make selected pixels transparent
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 255) {
      const dataIndex = i * 4;
      result.data[dataIndex + 3] = 0; // Set alpha to 0 (transparent)
    }
  }

  return result;
}

/**
 * Invert a selection mask
 */
export function invertMask(mask: Uint8ClampedArray): Uint8ClampedArray {
  const inverted = new Uint8ClampedArray(mask.length);
  for (let i = 0; i < mask.length; i++) {
    inverted[i] = mask[i] === 255 ? 0 : 255;
  }
  return inverted;
}

/**
 * Grow/shrink selection mask
 */
export function expandMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  pixels: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask);

  for (let iteration = 0; iteration < Math.abs(pixels); iteration++) {
    const temp = new Uint8ClampedArray(mask.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;

        if (pixels > 0) {
          // Expand: if any neighbor is selected, select this pixel
          const hasSelectedNeighbor =
            (x > 0 && result[index - 1] === 255) ||
            (x < width - 1 && result[index + 1] === 255) ||
            (y > 0 && result[index - width] === 255) ||
            (y < height - 1 && result[index + width] === 255);

          temp[index] = hasSelectedNeighbor ? 255 : result[index];
        } else {
          // Shrink: only keep selected if all neighbors are selected
          const allNeighborsSelected =
            (x === 0 || result[index - 1] === 255) &&
            (x === width - 1 || result[index + 1] === 255) &&
            (y === 0 || result[index - width] === 255) &&
            (y === height - 1 || result[index + width] === 255);

          temp[index] = result[index] === 255 && allNeighborsSelected ? 255 : 0;
        }
      }
    }

    result.set(temp);
  }

  return result;
}
