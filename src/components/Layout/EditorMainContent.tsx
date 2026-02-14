import { CanvasEditor } from '../CanvasEditor';
import { Timeline } from '../Timeline';
import { useEditor } from '../../contexts/EditorContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useFrameOperations } from '../../hooks/useFrameOperations';

interface EditorMainContentProps {
  onCanvasClick: (x: number, y: number) => void;
}

export const EditorMainContent = ({ onCanvasClick }: EditorMainContentProps) => {
  const {
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    isManualSelectionMode,
    selectionMask,
    cropSelection,
    setCropSelection,
    selectedFrames,
    setSelectedFrames,
  } = useEditor();

  const {
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    isPlaying,
    play,
    pause,
    goToNextFrame,
    goToPreviousFrame,
  } = useWorkspace();

  const { handleReorderFrames: reorderFrames } = useFrameOperations();

  const currentFrame = frames[currentFrameIndex] || null;

  const handleReorderFrames = (fromIndex: number, toIndex: number) => {
    reorderFrames(fromIndex, toIndex, selectedFrames, setSelectedFrames);
  };

  return (
    <main className="main-content">
      <CanvasEditor
        frame={currentFrame}
        zoom={zoom}
        selectionMode={isManualSelectionMode}
        selectionMask={selectionMask}
        cropSelection={cropSelection}
        onCropSelectionChange={setCropSelection}
        onCanvasClick={onCanvasClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />
      <Timeline
        frames={frames}
        currentFrameIndex={currentFrameIndex}
        isPlaying={isPlaying}
        selectedFrames={selectedFrames}
        onFrameSelect={setCurrentFrameIndex}
        onFrameMultiSelect={setSelectedFrames}
        onReorderFrames={handleReorderFrames}
        onPlay={play}
        onPause={pause}
        onNext={goToNextFrame}
        onPrevious={goToPreviousFrame}
      />
    </main>
  );
};
