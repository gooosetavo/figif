import type { GifFrame } from '../types/gif.types';

/**
 * "Intensifies" effect - Makes the subject shake/vibrate
 * Shifts non-transparent pixels randomly every other frame
 */
export function applyIntensifiesEffect(frames: GifFrame[], intensity: number = 3): GifFrame[] {
  // Add padding first to prevent clipping during shake
  const paddedFrames = frames.map(frame => addPadding(frame));

  return paddedFrames.map((frame, index) => {
    // Alternate direction every other frame for shaking effect
    const direction = index % 2 === 0 ? 1 : -1;
    const offsetX = Math.floor(Math.random() * intensity * 2 - intensity) * direction;
    const offsetY = Math.floor(Math.random() * intensity * 2 - intensity) * direction;

    return shiftFrame(frame, offsetX, offsetY);
  });
}

/**
 * "Party" effect - Cycles background colors rapidly
 * Changes transparent/removed areas to vibrant colors
 */
export function applyPartyEffect(frames: GifFrame[]): GifFrame[] {
  const colors = [
    { r: 255, g: 0, b: 0 },     // Red
    { r: 255, g: 128, b: 0 },   // Orange
    { r: 255, g: 255, b: 0 },   // Yellow
    { r: 0, g: 255, b: 0 },     // Green
    { r: 0, g: 255, b: 255 },   // Cyan
    { r: 0, g: 0, b: 255 },     // Blue
    { r: 255, g: 0, b: 255 },   // Magenta
  ];

  return frames.map((frame, index) => {
    const color = colors[index % colors.length];
    return colorizeTransparent(frame, color);
  });
}

/**
 * "On-Drugs" effect - Combines party, intensifies, and rotation
 */
export function applyOnDrugsEffect(frames: GifFrame[]): GifFrame[] {
  // Add padding first to prevent clipping during shake and rotation
  let processedFrames = frames.map(frame => addPadding(frame));

  // Apply party effect
  processedFrames = applyPartyEffect(processedFrames);

  // Apply intensifies (without additional padding since we already added it)
  processedFrames = processedFrames.map((frame, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    const offsetX = Math.floor(Math.random() * 4 * 2 - 4) * direction;
    const offsetY = Math.floor(Math.random() * 4 * 2 - 4) * direction;
    return shiftFrame(frame, offsetX, offsetY);
  });

  // Apply random rotation
  processedFrames = processedFrames.map((frame, _index) => {
    const angle = (Math.random() - 0.5) * 15; // ±7.5 degrees
    return rotateFrame(frame, angle);
  });

  return processedFrames;
}

/**
 * Shifts a frame by the given offset
 */
function shiftFrame(frame: GifFrame, offsetX: number, offsetY: number): GifFrame {
  const { width, height } = frame.imageData;
  const sourceData = frame.imageData.data;
  const newImageData = new ImageData(width, height);
  const newData = newImageData.data;

  // Copy pixels with offset, preserving transparency
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceX = x - offsetX;
      const sourceY = y - offsetY;

      // Check if source pixel is within bounds
      if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
        const sourceIndex = (sourceY * width + sourceX) * 4;
        const targetIndex = (y * width + x) * 4;

        newData[targetIndex] = sourceData[sourceIndex];         // R
        newData[targetIndex + 1] = sourceData[sourceIndex + 1]; // G
        newData[targetIndex + 2] = sourceData[sourceIndex + 2]; // B
        newData[targetIndex + 3] = sourceData[sourceIndex + 3]; // A
      }
    }
  }

  // Create new canvas with shifted data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(newImageData, 0, 0);
  }

  return {
    ...frame,
    imageData: newImageData,
    canvas,
  };
}

/**
 * Colorizes transparent pixels with the given color
 */
function colorizeTransparent(frame: GifFrame, color: { r: number; g: number; b: number }): GifFrame {
  const { width, height } = frame.imageData;
  const sourceData = frame.imageData.data;
  const newImageData = new ImageData(new Uint8ClampedArray(sourceData), width, height);
  const newData = newImageData.data;

  for (let i = 0; i < newData.length; i += 4) {
    // If pixel is transparent or nearly transparent
    if (newData[i + 3] < 128) {
      newData[i] = color.r;
      newData[i + 1] = color.g;
      newData[i + 2] = color.b;
      newData[i + 3] = 255; // Make it opaque
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(newImageData, 0, 0);
  }

  return {
    ...frame,
    imageData: newImageData,
    canvas,
  };
}

/**
 * Rotates a frame by the given angle (in degrees)
 */
function rotateFrame(frame: GifFrame, angleDegrees: number): GifFrame {
  const { width, height } = frame.imageData;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return frame;

  // Move to center, rotate, move back
  ctx.translate(width / 2, height / 2);
  ctx.rotate((angleDegrees * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  // Draw the original image
  ctx.putImageData(frame.imageData, 0, 0);

  // Get the rotated image data
  const rotatedImageData = ctx.getImageData(0, 0, width, height);

  return {
    ...frame,
    imageData: rotatedImageData,
    canvas,
  };
}

/**
 * Rotates a frame by 90 degrees (clockwise or counterclockwise)
 * @param frame - The frame to rotate
 * @param clockwise - If true, rotate 90° clockwise; if false, rotate 90° counterclockwise
 */
export function rotate90(frame: GifFrame, clockwise: boolean = true): GifFrame {
  const { width, height } = frame.imageData;
  const sourceData = frame.imageData.data;

  // Swap dimensions for 90° rotation
  const newWidth = height;
  const newHeight = width;
  const newImageData = new ImageData(newWidth, newHeight);
  const newData = newImageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex = (y * width + x) * 4;
      let targetX: number, targetY: number;

      if (clockwise) {
        // 90° clockwise: (x, y) -> (height - 1 - y, x)
        targetX = height - 1 - y;
        targetY = x;
      } else {
        // 90° counterclockwise: (x, y) -> (y, width - 1 - x)
        targetX = y;
        targetY = width - 1 - x;
      }

      const targetIndex = (targetY * newWidth + targetX) * 4;

      newData[targetIndex] = sourceData[sourceIndex];         // R
      newData[targetIndex + 1] = sourceData[sourceIndex + 1]; // G
      newData[targetIndex + 2] = sourceData[sourceIndex + 2]; // B
      newData[targetIndex + 3] = sourceData[sourceIndex + 3]; // A
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(newImageData, 0, 0);
  }

  return {
    ...frame,
    imageData: newImageData,
    canvas,
  };
}

/**
 * Flips a frame horizontally or vertically
 * @param frame - The frame to flip
 * @param horizontal - If true, flip horizontally; if false, flip vertically
 */
export function flipFrame(frame: GifFrame, horizontal: boolean = true): GifFrame {
  const { width, height } = frame.imageData;
  const sourceData = frame.imageData.data;
  const newImageData = new ImageData(width, height);
  const newData = newImageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex = (y * width + x) * 4;
      let targetX: number, targetY: number;

      if (horizontal) {
        // Flip horizontally: (x, y) -> (width - 1 - x, y)
        targetX = width - 1 - x;
        targetY = y;
      } else {
        // Flip vertically: (x, y) -> (x, height - 1 - y)
        targetX = x;
        targetY = height - 1 - y;
      }

      const targetIndex = (targetY * width + targetX) * 4;

      newData[targetIndex] = sourceData[sourceIndex];         // R
      newData[targetIndex + 1] = sourceData[sourceIndex + 1]; // G
      newData[targetIndex + 2] = sourceData[sourceIndex + 2]; // B
      newData[targetIndex + 3] = sourceData[sourceIndex + 3]; // A
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(newImageData, 0, 0);
  }

  return {
    ...frame,
    imageData: newImageData,
    canvas,
  };
}

/**
 * Adds padding around a frame to prevent clipping during transformations
 * Padding is at least 4 pixels or 1% of dimension, whichever is smaller
 */
function addPadding(frame: GifFrame): GifFrame {
  const { width, height } = frame.imageData;

  // Calculate padding: minimum of 4 pixels or 1% of dimension
  const paddingX = Math.min(4, Math.ceil(width * 0.01));
  const paddingY = Math.min(4, Math.ceil(height * 0.01));

  return addCustomPadding(frame, paddingX, paddingX, paddingY, paddingY);
}

/**
 * Adds custom padding to specific borders of a frame
 * @param frame - The frame to add padding to
 * @param left - Pixels to add to left border
 * @param right - Pixels to add to right border
 * @param top - Pixels to add to top border
 * @param bottom - Pixels to add to bottom border
 */
export function addCustomPadding(
  frame: GifFrame,
  left: number,
  right: number,
  top: number,
  bottom: number
): GifFrame {
  const { width, height } = frame.imageData;

  // Create new canvas with padding
  const newWidth = width + left + right;
  const newHeight = height + top + bottom;

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) return frame;

  // Clear canvas to transparent
  ctx.clearRect(0, 0, newWidth, newHeight);

  // Draw original image with appropriate offset
  ctx.putImageData(frame.imageData, left, top);

  // Get the padded image data
  const paddedImageData = ctx.getImageData(0, 0, newWidth, newHeight);

  return {
    ...frame,
    imageData: paddedImageData,
    canvas,
  };
}
