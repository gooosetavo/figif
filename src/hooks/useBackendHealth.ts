import { useEffect, useState } from 'react';
import { backendClient } from '../services/grpcClient';
import { useEditor } from '../contexts/EditorContext';

export interface BackendHealthStatus {
  isAvailable: boolean;
  error: string | null;
  isChecking: boolean;
}

/**
 * Custom hook to monitor backend server health
 * Checks availability on mount and periodically (every 30 seconds)
 * Automatically falls back to browser mode if backend becomes unavailable
 */
export const useBackendHealth = () => {
  const { processingMode, setProcessingMode, setIsBackendAvailable } = useEditor();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const available = await backendClient.isAvailable();
        setIsBackendAvailable(available);

        if (available) {
          setError(null);
        } else {
          setError('Backend server is not responding. Make sure the server is running on http://localhost:8080');
        }

        // If backend was selected but is not available, switch to browser mode
        if (processingMode === 'backend' && !available) {
          setProcessingMode('browser');
        }
      } catch (err) {
        setIsBackendAvailable(false);
        setError(
          err instanceof Error
            ? `Connection failed: ${err.message}`
            : 'Unable to connect to backend server'
        );

        if (processingMode === 'backend') {
          setProcessingMode('browser');
        }
      }
    };

    checkBackend();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [setIsBackendAvailable, processingMode, setProcessingMode]);

  return { error };
};
