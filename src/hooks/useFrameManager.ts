import { useState, useCallback, useEffect, useRef } from 'react';
import { cloneImageData } from '../utils/gifParser';
import type { GifFrame, DecodedGif } from '../types/gif.types';

interface UseFrameManagerReturn {
  frames: GifFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  setFrames: (frames: GifFrame[]) => void;
  setCurrentFrameIndex: (index: number) => void;
  goToNextFrame: () => void;
  goToPreviousFrame: () => void;
  play: () => void;
  pause: () => void;
  addFrame: (index: number, frame?: GifFrame) => void;
  deleteFrame: (index: number) => void;
  duplicateFrame: (index: number) => void;
  reorderFrame: (fromIndex: number, toIndex: number) => void;
  reverseFrames: () => void;
  updateFrameDelay: (index: number, delay: number) => void;
  updateAllFrameDelays: (delay: number) => void;
  loadGif: (gif: DecodedGif) => void;
  clearFrames: () => void;
}

export function useFrameManager(): UseFrameManagerReturn {
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, []);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const currentFrame = frames[currentFrameIndex];
    playbackTimerRef.current = window.setTimeout(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, currentFrame.delay);

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, [isPlaying, currentFrameIndex, frames]);

  const goToNextFrame = useCallback(() => {
    setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
  }, [frames.length]);

  const goToPreviousFrame = useCallback(() => {
    setCurrentFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  }, [frames.length]);

  const play = useCallback(() => {
    if (frames.length > 0) {
      setIsPlaying(true);
    }
  }, [frames.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const addFrame = useCallback(
    (index: number, frame?: GifFrame) => {
      const newFrame: GifFrame = frame || {
        imageData: new ImageData(
          frames[0]?.imageData.width || 100,
          frames[0]?.imageData.height || 100
        ),
        delay: 100,
        disposalType: 0,
      };

      setFrames((prev) => {
        const newFrames = [...prev];
        newFrames.splice(index + 1, 0, newFrame);
        return newFrames;
      });
    },
    [frames]
  );

  const deleteFrame = useCallback(
    (index: number) => {
      if (frames.length <= 1) {
        return; // Don't delete the last frame
      }

      setFrames((prev) => prev.filter((_, i) => i !== index));

      // Adjust current frame index if needed
      if (currentFrameIndex >= frames.length - 1) {
        setCurrentFrameIndex(Math.max(0, frames.length - 2));
      }
    },
    [frames.length, currentFrameIndex]
  );

  const duplicateFrame = useCallback(
    (index: number) => {
      const frameToDuplicate = frames[index];
      if (!frameToDuplicate) return;

      const duplicatedFrame: GifFrame = {
        imageData: cloneImageData(frameToDuplicate.imageData),
        delay: frameToDuplicate.delay,
        disposalType: frameToDuplicate.disposalType,
      };

      addFrame(index, duplicatedFrame);
    },
    [frames, addFrame]
  );

  const reorderFrame = useCallback((fromIndex: number, toIndex: number) => {
    setFrames((prev) => {
      const newFrames = [...prev];
      const [movedFrame] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, movedFrame);
      return newFrames;
    });
  }, []);

  const reverseFrames = useCallback(() => {
    setFrames((prev) => [...prev].reverse());
    setCurrentFrameIndex((prev) => frames.length - 1 - prev);
  }, [frames.length]);

  const updateFrameDelay = useCallback((index: number, delay: number) => {
    setFrames((prev) =>
      prev.map((frame, i) => (i === index ? { ...frame, delay } : frame))
    );
  }, []);

  const updateAllFrameDelays = useCallback((delay: number) => {
    setFrames((prev) => prev.map((frame) => ({ ...frame, delay })));
  }, []);

  const loadGif = useCallback((gif: DecodedGif) => {
    setFrames(gif.frames);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, []);

  const clearFrames = useCallback(() => {
    setFrames([]);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, []);

  return {
    frames,
    currentFrameIndex,
    isPlaying,
    setFrames,
    setCurrentFrameIndex,
    goToNextFrame,
    goToPreviousFrame,
    play,
    pause,
    addFrame,
    deleteFrame,
    duplicateFrame,
    reorderFrame,
    reverseFrames,
    updateFrameDelay,
    updateAllFrameDelays,
    loadGif,
    clearFrames,
  };
}
