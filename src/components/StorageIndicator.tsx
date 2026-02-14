import { formatBytes, estimateGifSize } from '../utils/storageSize';
import './StorageIndicator.css';

interface StorageIndicatorProps {
  currentFrameSize?: number;
  totalSize?: number;
  originalFileSize?: number;
}

export function StorageIndicator({ currentFrameSize, totalSize, originalFileSize }: StorageIndicatorProps) {
  // Don't show anything if we don't have data
  if (currentFrameSize === undefined || totalSize === undefined) {
    return null;
  }

  const gifSize = originalFileSize ?? estimateGifSize(totalSize);
  const gifSizeLabel = originalFileSize ? 'Original GIF:' : 'Est. GIF Size:';

  return (
    <div className="storage-indicator">
      <div
        className="storage-indicator-item"
        title="Size of the current frame's uncompressed RGBA pixel data (4 bytes per pixel)"
      >
        <span className="storage-indicator-label">Current Frame:</span>
        <span className="storage-indicator-value">{formatBytes(currentFrameSize)}</span>
      </div>
      <div
        className="storage-indicator-item"
        title="Total uncompressed RGBA data for all frames. Required for pixel-level editing but much larger than compressed GIF files."
      >
        <span className="storage-indicator-label">Raw Storage:</span>
        <span className="storage-indicator-value">{formatBytes(totalSize)}</span>
      </div>
      <div
        className="storage-indicator-item"
        title={
          originalFileSize
            ? 'Original file size with LZW compression and palette optimization'
            : 'Estimated export size with compression (~12x smaller than raw)'
        }
      >
        <span className="storage-indicator-label">{gifSizeLabel}</span>
        <span className="storage-indicator-value">{formatBytes(gifSize)}</span>
      </div>
    </div>
  );
}
