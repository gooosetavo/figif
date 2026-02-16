import { useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { sessionClient } from '../services/sessionClient';

/**
 * Custom hook to manage backend session lifecycle
 * - Ends session when switching to browser mode
 * - Ends session when component unmounts
 */
export const useSessionManager = () => {
  const { processingMode } = useEditor();

  // End session when switching to browser mode
  useEffect(() => {
    if (processingMode === 'browser' && sessionClient.hasActiveSession()) {
      console.log('🔄 Switching to browser mode - ending backend session');
      sessionClient.endSession();
    }
  }, [processingMode]);

  // End session on unmount
  useEffect(() => {
    return () => {
      if (sessionClient.hasActiveSession()) {
        console.log('🧹 Component unmounting - ending backend session');
        sessionClient.endSession();
      }
    };
  }, []);

  return {
    hasActiveSession: sessionClient.hasActiveSession.bind(sessionClient),
    getSessionId: sessionClient.getSessionId.bind(sessionClient),
  };
};
