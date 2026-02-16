import { useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { sessionClient } from '../services/sessionClient';

/**
 * Custom hook to manage backend session lifecycle
 * - Starts token refresh when session is active
 * - Keeps session alive across mode switches (persists for 24 hours)
 * - Session only expires after 24 hours of inactivity
 */
export const useSessionManager = () => {
  const { processingMode } = useEditor();

  // Start/stop token refresh based on session state
  useEffect(() => {
    if (sessionClient.hasActiveSession()) {
      console.log('🔄 Starting session token refresh (keeps session alive)');
      sessionClient.startTokenRefresh();
    }

    return () => {
      // Stop token refresh on unmount, but don't end the session
      // Session will naturally expire after 24 hours of inactivity
      sessionClient.stopTokenRefresh();
    };
  }, [processingMode]);

  return {
    hasActiveSession: sessionClient.hasActiveSession.bind(sessionClient),
    getSessionId: sessionClient.getSessionId.bind(sessionClient),
    endSession: sessionClient.endSession.bind(sessionClient),
  };
};
