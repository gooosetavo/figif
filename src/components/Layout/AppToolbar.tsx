import { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useExportOperations } from '../../hooks/useExportOperations';
import { useEditor } from '../../contexts/EditorContext';
import { backendClient } from '../../services/grpcClient';

interface AppToolbarProps {
  onShowExportModal: () => void;
}

export const AppToolbar = ({ onShowExportModal }: AppToolbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { handleExport, isEncoding, progress, exportProgress } = useExportOperations();
  const { processingMode, setProcessingMode, isBackendAvailable, setIsBackendAvailable } = useEditor();

  // Check backend availability on mount
  useEffect(() => {
    const checkBackend = async () => {
      const available = await backendClient.isAvailable();
      setIsBackendAvailable(available);

      // If backend was selected but is not available, switch to browser mode
      if (processingMode === 'backend' && !available) {
        setProcessingMode('browser');
      }
    };
    checkBackend();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [setIsBackendAvailable, processingMode, setProcessingMode]);

  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <button onClick={handleExport} disabled={isEncoding} className="toolbar-button export-button">
          {isEncoding ? `Exporting... ${progress}%` : '💾 Download GIF'}
        </button>
        <button
          onClick={onShowExportModal}
          disabled={isEncoding || exportProgress > 0}
          className="toolbar-button"
        >
          📤 Export As...
        </button>
        <button onClick={() => window.location.reload()} className="toolbar-button">
          📂 Load New Image
        </button>
        <button
          onClick={toggleTheme}
          className="toolbar-button"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        {/* Processing Mode Toggle */}
        <button
          onClick={() => setProcessingMode(processingMode === 'browser' ? 'backend' : 'browser')}
          className="toolbar-button"
          disabled={processingMode === 'backend' && !isBackendAvailable}
          title={
            processingMode === 'browser'
              ? 'Switch to backend processing (offload to server)'
              : isBackendAvailable
              ? 'Switch to in-browser processing'
              : 'Backend server not available'
          }
          style={{
            opacity: processingMode === 'backend' && !isBackendAvailable ? 0.5 : 1,
          }}
        >
          {processingMode === 'browser' ? '🌐 Browser Mode' : '⚡ Backend Mode'}
          {processingMode === 'backend' && !isBackendAvailable && ' (offline)'}
        </button>
      </div>
    </div>
  );
};
