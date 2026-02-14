import { useWorkspace } from '../contexts/WorkspaceContext';
import { useGifDecoder } from './useGifDecoder';
import { isGifFile, convertImageToGif } from '../utils/imageToGif';

export const useFileOperations = () => {
  const { createWorkspace, activeWorkspace, loadGif, saveSnapshot } = useWorkspace();
  const { decodeGif } = useGifDecoder();

  const handleFileSelect = async (file: File) => {
    try {
      let decodedGif;

      // Check if file is a GIF or needs conversion
      if (isGifFile(file)) {
        decodedGif = await decodeGif(file);
      } else {
        // Convert static image to GIF
        decodedGif = await convertImageToGif(file);
      }

      // Create or load into workspace
      if (!activeWorkspace) {
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        await createWorkspace(fileName, decodedGif);
      } else {
        loadGif(decodedGif);
        const description = isGifFile(file) ? 'GIF loaded' : 'Image loaded';
        await saveSnapshot(decodedGif.frames, 0, description, true);
      }
    } catch (err) {
      console.error('Failed to load image:', err);
    }
  };

  return {
    handleFileSelect,
  };
};
