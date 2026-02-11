export interface GifFrame {
  imageData: ImageData;
  delay: number; // Delay in milliseconds
  disposalType: number; // 0-3, determines how frame is cleared
  canvas?: HTMLCanvasElement;
}

export interface GifMetadata {
  width: number;
  height: number;
  loopCount: number; // 0 for infinite
  frameCount: number;
  totalDuration: number; // Total animation duration in ms
}

export interface DecodedGif {
  frames: GifFrame[];
  metadata: GifMetadata;
}

export interface EditState {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  resize?: {
    width: number;
    height: number;
  };
  filters?: {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    saturation?: number; // -100 to 100
    hue?: number; // 0 to 360
    grayscale?: boolean;
    blur?: number; // 0 to 20
  };
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  frameIndices: number[]; // Which frames to apply to
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  frameIndices: number[];
}

export interface ExportOptions {
  quality: number; // 1-10, affects color palette size
  loopCount: number; // 0 for infinite
  transparent?: boolean;
}

export interface EditorState {
  gif: DecodedGif | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  editState: EditState;
  textOverlays: TextOverlay[];
  stickerOverlays: StickerOverlay[];
  history: DecodedGif[]; // For undo functionality
}
