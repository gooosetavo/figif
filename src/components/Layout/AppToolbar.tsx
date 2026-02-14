import { useTheme } from '../../contexts/ThemeContext';
import { useExportOperations } from '../../hooks/useExportOperations';

interface AppToolbarProps {
  onShowExportModal: () => void;
}

export const AppToolbar = ({ onShowExportModal }: AppToolbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { handleExport, isEncoding, progress, exportProgress } = useExportOperations();

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
      </div>
    </div>
  );
};
