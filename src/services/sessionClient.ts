import type { GifFrame } from '../types/gif.types';
import type {
  SessionInfo,
  CreateSessionRequest,
  UploadFrameData,
  UploadFramesRequest,
  UploadFramesResponse,
  OperationResponse,
  SessionQuotaResponse,
  RemoveBackgroundRequest,
  ManualRemoveBackgroundRequest,
} from '../types/session.types';

const BATCH_SIZE = 10; // Upload 10 frames at a time

export class SessionClient {
  private sessionToken: string | null = null;
  private sessionId: string | null = null;
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8080', timeout: number = 300000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;

    // Try to restore session from sessionStorage
    this.restoreSession();
  }

  /**
   * Check if there's an active session
   */
  hasActiveSession(): boolean {
    return this.sessionToken !== null && this.sessionId !== null;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Restore session from sessionStorage if available
   */
  private restoreSession(): void {
    try {
      const token = sessionStorage.getItem('backendSessionToken');
      const id = sessionStorage.getItem('backendSessionId');

      if (token && id) {
        this.sessionToken = token;
        this.sessionId = id;
        console.log('🔄 Restored backend session:', id);
      }
    } catch (error) {
      console.warn('Failed to restore session from storage:', error);
    }
  }

  /**
   * Save session to sessionStorage
   */
  private saveSession(): void {
    try {
      if (this.sessionToken && this.sessionId) {
        sessionStorage.setItem('backendSessionToken', this.sessionToken);
        sessionStorage.setItem('backendSessionId', this.sessionId);
      }
    } catch (error) {
      console.warn('Failed to save session to storage:', error);
    }
  }

  /**
   * Clear session from sessionStorage
   */
  private clearStoredSession(): void {
    try {
      sessionStorage.removeItem('backendSessionToken');
      sessionStorage.removeItem('backendSessionId');
    } catch (error) {
      console.warn('Failed to clear session from storage:', error);
    }
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
   * Create a new backend session
   */
  async createSession(workspaceId?: string): Promise<SessionInfo> {
    try {
      console.log('🔑 Creating backend session...');

      const request: CreateSessionRequest = workspaceId ? { workspaceId } : {};

      const response = await fetch(`${this.baseUrl}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const sessionInfo: SessionInfo = await response.json();

      this.sessionToken = sessionInfo.sessionToken;
      this.sessionId = sessionInfo.sessionId;
      this.saveSession();

      console.log('✅ Session created:', sessionInfo.sessionId);

      return sessionInfo;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Session creation timed out. Backend server may be offline.');
        }
        throw error;
      }
      throw new Error('Failed to create session');
    }
  }

  /**
   * Upload frames to the backend in batches
   */
  async uploadFrames(
    frames: GifFrame[],
    progressCallback?: (uploaded: number, total: number) => void
  ): Promise<void> {
    if (!this.hasActiveSession()) {
      throw new Error('No active session. Call createSession() first.');
    }

    console.log(`⬆️ Uploading ${frames.length} frames in batches of ${BATCH_SIZE}...`);

    const batches: GifFrame[][] = [];
    for (let i = 0; i < frames.length; i += BATCH_SIZE) {
      batches.push(frames.slice(i, i + BATCH_SIZE));
    }

    let uploadedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Convert frames to upload format
      const uploadData: UploadFrameData[] = await Promise.all(
        batch.map(async (frame, idx) => ({
          index: batchIndex * BATCH_SIZE + idx,
          imageData: await this.imageDataToBase64(frame.imageData),
          delay: frame.delay,
        }))
      );

      const request: UploadFramesRequest = {
        frames: uploadData,
        metadata:
          batchIndex === 0
            ? {
                width: frames[0].imageData.width,
                height: frames[0].imageData.height,
              }
            : undefined,
      };

      const response = await fetch(`${this.baseUrl}/api/session/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sessionToken}`,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload batch ${batchIndex + 1}: ${errorText}`);
      }

      const result: UploadFramesResponse = await response.json();
      uploadedCount += result.uploadedFrames;

      if (progressCallback) {
        progressCallback(uploadedCount, frames.length);
      }

      console.log(
        `✅ Uploaded batch ${batchIndex + 1}/${batches.length} (${result.uploadedFrames} frames, ${(result.totalSize / 1024 / 1024).toFixed(2)}MB)`
      );
    }

    console.log(`✅ All ${uploadedCount} frames uploaded successfully`);
  }

  /**
   * Process a frame with background removal (AI mode)
   */
  async removeBackgroundFromFrame(
    frameIndex: number,
    mode: string = 'ai',
    config?: { sensitivity?: number; edgeSmoothing?: number }
  ): Promise<void> {
    if (!this.hasActiveSession()) {
      throw new Error('No active session. Call createSession() first.');
    }

    const request: RemoveBackgroundRequest = {
      mode,
      config,
    };

    const response = await fetch(`${this.baseUrl}/api/session/frame/${frameIndex}/remove-bg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.sessionToken}`,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process frame ${frameIndex}: ${errorText}`);
    }

    const result: OperationResponse = await response.json();

    if (!result.success) {
      throw new Error(`Processing failed for frame ${frameIndex}`);
    }

    console.log(
      `✅ Frame ${frameIndex} processed in ${result.processingTimeMs || 0}ms`
    );
  }

  /**
   * Process a frame with manual background removal
   */
  async manualRemoveBackgroundFromFrame(
    frameIndex: number,
    selections: Array<{ x: number; y: number }>,
    invert: boolean,
    effect: string
  ): Promise<void> {
    if (!this.hasActiveSession()) {
      throw new Error('No active session. Call createSession() first.');
    }

    const request: ManualRemoveBackgroundRequest = {
      selections,
      invert,
      effect,
    };

    const response = await fetch(
      `${this.baseUrl}/api/session/frame/${frameIndex}/manual-remove-bg`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sessionToken}`,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process frame ${frameIndex}: ${errorText}`);
    }

    const result: OperationResponse = await response.json();

    if (!result.success) {
      throw new Error(`Manual processing failed for frame ${frameIndex}`);
    }

    console.log(
      `✅ Frame ${frameIndex} manually processed in ${result.processingTimeMs || 0}ms`
    );
  }

  /**
   * Download a processed frame from the backend
   */
  async getProcessedFrame(
    frameIndex: number,
    width: number,
    height: number,
    frameType: 'original' | 'processed' | 'thumbnail' = 'processed'
  ): Promise<ImageData> {
    if (!this.hasActiveSession()) {
      throw new Error('No active session. Call createSession() first.');
    }

    const response = await fetch(
      `${this.baseUrl}/api/session/frame/${frameIndex}?type=${frameType}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
        },
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download frame ${frameIndex}: ${errorText}`);
    }

    // Response is PNG binary data
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });

    return await this.base64ToImageData(base64, width, height);
  }

  /**
   * Get session quota information
   */
  async getQuotaInfo(): Promise<SessionQuotaResponse> {
    if (!this.hasActiveSession()) {
      throw new Error('No active session. Call createSession() first.');
    }

    const response = await fetch(`${this.baseUrl}/api/session/quota`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.sessionToken}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error('Failed to get quota information');
    }

    return await response.json();
  }

  /**
   * End the current session and cleanup
   */
  async endSession(): Promise<void> {
    if (!this.hasActiveSession()) {
      console.log('ℹ️ No active session to end');
      return;
    }

    console.log('🔚 Ending backend session:', this.sessionId);

    try {
      const response = await fetch(`${this.baseUrl}/api/session/end`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn('Failed to end session gracefully:', response.statusText);
      } else {
        console.log('✅ Session ended successfully');
      }
    } catch (error) {
      console.warn('Error ending session:', error);
    } finally {
      // Always clear local state even if request fails
      this.sessionToken = null;
      this.sessionId = null;
      this.clearStoredSession();
    }
  }
}

// Singleton instance
export const sessionClient = new SessionClient();
