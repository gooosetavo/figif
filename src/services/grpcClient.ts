/**
 * gRPC Client for communicating with the backend server
 * For now, using fetch API with JSON - can be upgraded to grpc-web later
 */

export type ProcessingMode = 'browser' | 'backend';

export interface RemoveBackgroundRequest {
  imageData: string; // base64 encoded image
  format: string;
}

export interface RemoveBackgroundResponse {
  processedImage: string; // base64 encoded
  error?: string;
  processingTimeMs: number;
}

export interface OptimizeGIFRequest {
  gifData: string; // base64 encoded
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

export interface OptimizeGIFResponse {
  optimizedGif: string; // base64 encoded
  originalSize: number;
  optimizedSize: number;
  error?: string;
  processingTimeMs: number;
}

export interface SelectionPoint {
  x: number;
  y: number;
  tolerance: number;
}

export interface ManualRemoveBackgroundRequest {
  imageData: string; // base64 encoded
  width: number;
  height: number;
  selections: SelectionPoint[];
  invert: boolean;
  effect: string;
}

export interface ManualRemoveBackgroundResponse {
  processedImage: string; // base64 encoded
  error?: string;
  processingTimeMs: number;
}

class BackendClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8080', timeout: number = 120000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Convert ImageData to base64 PNG
   */
  private imageDataToBase64(imageData: ImageData): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert to blob'));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      }, 'image/png');
    });
  }

  /**
   * Convert base64 to ImageData
   */
  private base64ToImageData(base64: string, width: number, height: number): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = `data:image/png;base64,${base64}`;
    });
  }

  /**
   * Remove background using backend server
   */
  async removeBackground(imageData: ImageData, format: string = 'png'): Promise<ImageData> {
    try {
      const base64Image = await this.imageDataToBase64(imageData);

      const response = await fetch(`${this.baseUrl}/api/remove-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Image,
          format,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const result: RemoveBackgroundResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      console.log(`Backend processing took ${result.processingTimeMs}ms`);

      return await this.base64ToImageData(result.processedImage, imageData.width, imageData.height);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Backend request timed out. The server may be overloaded or offline.');
        }
        throw error;
      }
      throw new Error('Failed to communicate with backend');
    }
  }

  /**
   * Manual background removal using selections
   */
  async manualRemoveBackground(
    imageData: ImageData,
    selections: SelectionPoint[],
    invert: boolean,
    effect: string
  ): Promise<ImageData> {
    try {
      const base64Image = await this.imageDataToBase64(imageData);

      const response = await fetch(`${this.baseUrl}/api/manual-remove-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Image,
          width: imageData.width,
          height: imageData.height,
          selections,
          invert,
          effect,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const result: ManualRemoveBackgroundResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      console.log(`Backend manual processing took ${result.processingTimeMs}ms`);

      return await this.base64ToImageData(result.processedImage, imageData.width, imageData.height);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Backend request timed out. The server may be overloaded or offline.');
        }
        throw error;
      }
      throw new Error('Failed to communicate with backend');
    }
  }

  /**
   * Check if backend server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const backendClient = new BackendClient();
