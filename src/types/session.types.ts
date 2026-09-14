export interface SessionInfo {
  sessionToken: string;
  sessionId: string;
  expiresAt: number;
}

export interface CreateSessionRequest {
  workspaceId?: string;
}

export interface UploadFrameData {
  index: number;
  imageData: string; // base64
  delay: number;
}

export interface UploadFramesRequest {
  frames: UploadFrameData[];
  metadata?: {
    width: number;
    height: number;
  };
}

export interface UploadFramesResponse {
  uploadedFrames: number;
  totalSize: number;
}

export interface OperationResponse {
  success: boolean;
  frameId: number;
  processingTimeMs?: number;
}

export interface QuotaInfo {
  currentSize: number;
  maxSize: number;
  availableSpace: number;
  percentUsed: number;
}

export interface SessionQuotaResponse {
  sessionId: string;
  quota: QuotaInfo;
}

export interface RemoveBackgroundRequest {
  mode: string;
  config?: {
    sensitivity?: number;
    edgeSmoothing?: number;
  };
}

export interface ManualRemoveBackgroundRequest {
  selections: Array<{ x: number; y: number }>;
  invert: boolean;
  effect: string;
}
