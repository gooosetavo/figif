package session

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// CleanupService periodically removes expired sessions
type CleanupService struct {
	sessionManager  *SessionManager
	cleanupInterval time.Duration
	sessionTTL      time.Duration
	gracePeriod     time.Duration
	stopCh          chan struct{}
}

// NewCleanupService creates a new cleanup service
func NewCleanupService(sessionManager *SessionManager, cleanupInterval time.Duration) *CleanupService {
	return &CleanupService{
		sessionManager:  sessionManager,
		cleanupInterval: cleanupInterval,
		sessionTTL:      DefaultSessionTTL,
		gracePeriod:     GracePeriod,
		stopCh:          make(chan struct{}),
	}
}

// Start begins the periodic cleanup process
func (cs *CleanupService) Start() {
	fmt.Println("Starting cleanup service...")
	go cs.run()
}

// Stop stops the cleanup service
func (cs *CleanupService) Stop() {
	fmt.Println("Stopping cleanup service...")
	close(cs.stopCh)
}

// run is the main cleanup loop
func (cs *CleanupService) run() {
	ticker := time.NewTicker(cs.cleanupInterval)
	defer ticker.Stop()

	// Run cleanup immediately on start
	cs.cleanupExpiredSessions()

	for {
		select {
		case <-ticker.C:
			cs.cleanupExpiredSessions()
		case <-cs.stopCh:
			return
		}
	}
}

// cleanupExpiredSessions removes sessions that have expired beyond the grace period
func (cs *CleanupService) cleanupExpiredSessions() {
	now := time.Now()
	deletedCount := 0

	// Get all sessions from memory
	sessionIDs := cs.sessionManager.ListSessions()

	for _, sessionID := range sessionIDs {
		metadata, err := cs.sessionManager.GetSession(sessionID)
		if err != nil {
			// Session might have been deleted already
			continue
		}

		// Check if session has expired beyond grace period
		if now.After(metadata.ExpiresAt.Add(cs.gracePeriod)) {
			fmt.Printf("Cleaning up expired session: %s (expired at %s)\n", sessionID, metadata.ExpiresAt.Format(time.RFC3339))
			if err := cs.sessionManager.EndSession(sessionID); err != nil {
				fmt.Printf("Error cleaning up session %s: %v\n", sessionID, err)
			} else {
				deletedCount++
			}
		}
	}

	// Also scan disk for orphaned sessions (sessions not in memory)
	deletedOrphanedCount, err := cs.cleanupOrphanedSessions(now)
	if err != nil {
		fmt.Printf("Error cleaning up orphaned sessions: %v\n", err)
	} else if deletedOrphanedCount > 0 {
		deletedCount += deletedOrphanedCount
	}

	if deletedCount > 0 {
		fmt.Printf("Cleanup complete: removed %d expired session(s)\n", deletedCount)
	}
}

// cleanupOrphanedSessions removes session directories that aren't in the in-memory cache
func (cs *CleanupService) cleanupOrphanedSessions(now time.Time) (int, error) {
	baseDir := cs.sessionManager.baseDir
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return 0, fmt.Errorf("failed to read base directory: %w", err)
	}

	deletedCount := 0
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		sessionID := entry.Name()

		// Validate session ID format
		if err := ValidateSessionID(sessionID); err != nil {
			// Skip invalid directories
			continue
		}

		// Try to load metadata
		metadata, err := cs.sessionManager.loadMetadataFromDisk(sessionID)
		if err != nil {
			// Corrupt metadata, remove the session
			fmt.Printf("Removing session with corrupt metadata: %s\n", sessionID)
			sessionPath := filepath.Join(baseDir, sessionID)
			if err := os.RemoveAll(sessionPath); err != nil {
				fmt.Printf("Error removing corrupt session %s: %v\n", sessionID, err)
			} else {
				deletedCount++
			}
			continue
		}

		// Check if expired beyond grace period
		if now.After(metadata.ExpiresAt.Add(cs.gracePeriod)) {
			fmt.Printf("Removing orphaned expired session: %s\n", sessionID)
			sessionPath := filepath.Join(baseDir, sessionID)
			if err := os.RemoveAll(sessionPath); err != nil {
				fmt.Printf("Error removing orphaned session %s: %v\n", sessionID, err)
			} else {
				deletedCount++
			}
		}
	}

	return deletedCount, nil
}

// GetStats returns statistics about the cleanup service
func (cs *CleanupService) GetStats() map[string]interface{} {
	activeSessions := len(cs.sessionManager.ListSessions())

	return map[string]interface{}{
		"activeSessions":  activeSessions,
		"cleanupInterval": cs.cleanupInterval.String(),
		"sessionTTL":      cs.sessionTTL.String(),
		"gracePeriod":     cs.gracePeriod.String(),
	}
}
