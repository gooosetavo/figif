import { useTheme } from '../../contexts/ThemeContext';
import { useExportOperations } from '../../hooks/useExportOperations';
import { useEditor } from '../../contexts/EditorContext';
import { useBackendHealth } from '../../hooks/useBackendHealth';

interface AppToolbarProps {
  onShowExportModal: () => void;
}

export const AppToolbar = ({ onShowExportModal }: AppToolbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { handleExport, isEncoding, progress, exportProgress } = useExportOperations();
  const { processingMode, setProcessingMode, isBackendAvailable } = useEditor();
  const { error: backendError } = useBackendHealth();

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

        {/* Processing Mode Toggle Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            background: 'var(--panel-bg)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
          title={
            !isBackendAvailable && backendError
              ? backendError
              : processingMode === 'backend'
              ? 'Backend processing active'
              : isBackendAvailable
              ? 'Click to switch to backend processing'
              : 'Backend server offline'
          }
        >
          <span style={{ fontSize: '14px', fontWeight: 500 }}>
            {processingMode === 'browser' ? '🌐 Browser' : '⚡ Backend'}
          </span>

          {/* Toggle Switch */}
          <label
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '24px',
              cursor: isBackendAvailable || processingMode === 'backend' ? 'pointer' : 'not-allowed',
            }}
          >
            <input
              type="checkbox"
              checked={processingMode === 'backend'}
              onChange={() => {
                if (processingMode === 'browser' && !isBackendAvailable) {
                  console.warn('⚠️ Cannot switch to backend - server is not available');
                  return; // Don't allow switching to backend if not available
                }
                const newMode = processingMode === 'browser' ? 'backend' : 'browser';
                console.log(`🔄 Switching processing mode: ${processingMode} → ${newMode}`);
                setProcessingMode(newMode);
              }}
              disabled={processingMode === 'browser' && !isBackendAvailable}
              style={{
                opacity: 0,
                width: 0,
                height: 0,
              }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: isBackendAvailable || processingMode === 'backend' ? 'pointer' : 'not-allowed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor:
                  processingMode === 'backend'
                    ? isBackendAvailable
                      ? '#10b981'
                      : '#ef4444'
                    : '#6b7280',
                transition: '0.3s',
                borderRadius: '24px',
                opacity: processingMode === 'browser' && !isBackendAvailable ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: processingMode === 'backend' ? '23px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </span>
          </label>

          {/* Health Indicator */}
          {processingMode === 'backend' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: isBackendAvailable ? '#10b981' : '#ef4444',
              }}
              title={isBackendAvailable ? 'Connected and ready' : backendError || 'Offline'}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isBackendAvailable ? '#10b981' : '#ef4444',
                  boxShadow: isBackendAvailable
                    ? '0 0 8px rgba(16, 185, 129, 0.6)'
                    : '0 0 8px rgba(239, 68, 68, 0.6)',
                  animation: isBackendAvailable ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              />
              {isBackendAvailable ? 'Ready' : 'Offline'}
            </span>
          )}

          {/* Show availability indicator in browser mode */}
          {processingMode === 'browser' && (
            <span
              style={{
                fontSize: '12px',
                color: isBackendAvailable ? '#10b981' : '#6b7280',
                opacity: 0.8,
              }}
              title={
                isBackendAvailable
                  ? 'Backend server available'
                  : backendError || 'Backend server offline'
              }
            >
              {isBackendAvailable ? '✓ Available' : '○ Unavailable'}
            </span>
          )}
        </div>

        {/* Add pulse animation for health indicator */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}} />
      </div>
    </div>
  );
};
