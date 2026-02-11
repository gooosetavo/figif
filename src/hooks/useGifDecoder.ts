import { useState, useCallback } from 'react';
import { parseGifFile } from '../utils/gifParser';
import type { DecodedGif } from '../types/gif.types';

interface UseGifDecoderReturn {
  decodeGif: (file: File) => Promise<DecodedGif>;
  isDecoding: boolean;
  error: string | null;
}

export function useGifDecoder(): UseGifDecoderReturn {
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodeGif = useCallback(async (file: File): Promise<DecodedGif> => {
    setIsDecoding(true);
    setError(null);

    try {
      // Validate file type
      if (!file.type.includes('gif')) {
        throw new Error('File must be a GIF image');
      }

      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('GIF file is too large (max 50MB)');
      }

      const decodedGif = await parseGifFile(file);

      // Warn if too many frames
      if (decodedGif.metadata.frameCount > 500) {
        console.warn('GIF has many frames, performance may be affected');
      }

      return decodedGif;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decode GIF';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDecoding(false);
    }
  }, []);

  return {
    decodeGif,
    isDecoding,
    error,
  };
}
