import { FileUpload } from '../FileUpload';
import { useGifDecoder } from '../../hooks/useGifDecoder';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface EmptyStateProps {
  onFileSelect: (file: File) => void;
}

export const EmptyState = ({ onFileSelect }: EmptyStateProps) => {
  const { isDecoding, error: decodeError } = useGifDecoder();
  const { isLoading, isCreatingWorkspace } = useWorkspace();

  if (isLoading) {
    return (
      <div className="upload-container">
        <p>Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="upload-container">
      <FileUpload
        onFileSelect={onFileSelect}
        isLoading={isDecoding || isCreatingWorkspace}
      />
      {decodeError && <p className="error-message">{decodeError}</p>}
    </div>
  );
};
