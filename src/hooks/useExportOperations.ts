import { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useGifEncoder } from './useGifEncoder';
import { exportAsPNG, exportAsAPNG, exportAsWebP, exportAsWebM, getExportFilename } from '../utils/exporters';
import type { ExportOptions } from '../components/ExportModal';

export const useExportOperations = () => {
  const { frames, currentFrameIndex } = useWorkspace();
  const { downloadGif, isEncoding, progress } = useGifEncoder();
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (frames.length === 0) return;

    try {
      await downloadGif(frames, 'edited.gif', {
        quality: 10,
        loopCount: 0,
      });
    } catch (err) {
      console.error('Failed to export GIF:', err);
    }
  };

  const handleExportWithOptions = async (options: ExportOptions, selectedFrames: Set<number>) => {
    if (frames.length === 0) return;

    try {
      setExportProgress(0);
      console.log('Exporting with format:', options.format, 'Options:', options);

      // Determine which frames to export
      const framesToExport = options.useSelectedFrames && selectedFrames.size > 0
        ? Array.from(selectedFrames).sort((a, b) => a - b).map(i => frames[i])
        : frames;

      const filename = getExportFilename(options.format);

      switch (options.format) {
        case 'gif':
          await downloadGif(framesToExport, filename, {
            quality: options.quality,
            loopCount: options.loopCount,
          });
          setExportProgress(100);
          break;

        case 'png': {
          // Export single frame (current or first selected)
          const frameToExport = options.useSelectedFrames && selectedFrames.size > 0
            ? frames[Array.from(selectedFrames)[0]]
            : frames[currentFrameIndex];
          await exportAsPNG(frameToExport, filename);
          setExportProgress(100);
          break;
        }

        case 'apng':
          await exportAsAPNG(framesToExport, filename, options, setExportProgress);
          break;

        case 'webp':
          await exportAsWebP(framesToExport, filename, options, setExportProgress);
          break;

        case 'webm':
          await exportAsWebM(framesToExport, filename, options, setExportProgress);
          break;

        default:
          console.error('Unsupported export format:', options.format);
      }
    } catch (err) {
      console.error('Failed to export:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setExportProgress(0);
    }
  };

  return {
    handleExport,
    handleExportWithOptions,
    exportProgress,
    setExportProgress,
    isEncoding,
    progress,
  };
};
