package session

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// SessionManager manages session lifecycle, JWT tokens, and in-memory session cache
type SessionManager struct {
	sessions  map[string]*SessionMetadata // In-memory cache of active sessions
	secretKey []byte                      // JWT signing key
	mu        sync.RWMutex                // Thread-safe access
	baseDir   string                      // Root directory for session storage
}

const (
	DefaultSessionTTL = 24 * time.Hour      // 24 hours
	GracePeriod       = 7 * 24 * time.Hour  // 7 days grace period before permanent deletion
)

// NewSessionManager creates a new session manager with the given secret key and base directory
func NewSessionManager(secretKey []byte, baseDir string) *SessionManager {
	return &SessionManager{
		sessions:  make(map[string]*SessionMetadata),
		secretKey: secretKey,
		baseDir:   baseDir,
	}
}

// GenerateSessionID creates a unique session identifier
func GenerateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate session ID: %w", err)
	}
	return "sess_" + hex.EncodeToString(bytes), nil
}

// ValidateSessionID checks if a session ID has a valid format (prevents path traversal)
func ValidateSessionID(sessionID string) error {
	// Only allow alphanumeric, underscore, and hyphen
	matched, err := regexp.MatchString(`^sess_[a-fA-F0-9]{32}$`, sessionID)
	if err != nil {
		return fmt.Errorf("regex error: %w", err)
	}
	if !matched {
		return fmt.Errorf("invalid session ID format: %s", sessionID)
	}
	return nil
}

// CreateSession creates a new session and returns metadata and JWT token
func (sm *SessionManager) CreateSession(workspaceID string, expiresIn time.Duration) (*SessionMetadata, string, error) {
	sessionID, err := GenerateSessionID()
	if err != nil {
		return nil, "", err
	}

	if expiresIn == 0 {
		expiresIn = DefaultSessionTTL
	}

	now := time.Now()
	metadata := &SessionMetadata{
		SessionID:   sessionID,
		WorkspaceID: workspaceID,
		CreatedAt:   now,
		LastAccess:  now,
		ExpiresAt:   now.Add(expiresIn),
		FrameCount:  0,
		StoragePath: filepath.Join(sm.baseDir, sessionID),
	}

	// Create storage directory
	if err := os.MkdirAll(metadata.StoragePath, 0755); err != nil {
		return nil, "", fmt.Errorf("failed to create session directory: %w", err)
	}

	// Save metadata to disk
	if err := sm.saveMetadataToDisk(metadata); err != nil {
		os.RemoveAll(metadata.StoragePath) // Cleanup on error
		return nil, "", err
	}

	// Add to in-memory cache
	sm.mu.Lock()
	sm.sessions[sessionID] = metadata
	sm.mu.Unlock()

	// Generate JWT token
	token, err := sm.GenerateToken(sessionID, 0, workspaceID, expiresIn)
	if err != nil {
		sm.EndSession(sessionID) // Cleanup on error
		return nil, "", err
	}

	return metadata, token, nil
}

// GenerateToken creates a JWT token for the given session
func (sm *SessionManager) GenerateToken(sessionID string, frameCount int, workspaceID string, expiresIn time.Duration) (string, error) {
	if expiresIn == 0 {
		expiresIn = DefaultSessionTTL
	}

	now := time.Now()
	claims := SessionClaims{
		SessionID:   sessionID,
		WorkspaceID: workspaceID,
		FrameCount:  frameCount,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(expiresIn)),
			Issuer:    "figif-backend",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(sm.secretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the claims
func (sm *SessionManager) ValidateToken(tokenString string) (*SessionClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &SessionClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return sm.secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*SessionClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Verify session exists and is not expired
	if err := ValidateSessionID(claims.SessionID); err != nil {
		return nil, fmt.Errorf("invalid session ID in token: %w", err)
	}

	return claims, nil
}

// GetSession retrieves session metadata by ID
func (sm *SessionManager) GetSession(sessionID string) (*SessionMetadata, error) {
	sm.mu.RLock()
	metadata, exists := sm.sessions[sessionID]
	sm.mu.RUnlock()

	if !exists {
		// Try to load from disk
		loadedMetadata, err := sm.loadMetadataFromDisk(sessionID)
		if err != nil {
			return nil, fmt.Errorf("session not found: %s", sessionID)
		}

		// Add to cache
		sm.mu.Lock()
		sm.sessions[sessionID] = loadedMetadata
		sm.mu.Unlock()

		metadata = loadedMetadata
	}

	// Update last access time
	sm.mu.Lock()
	metadata.LastAccess = time.Now()
	sm.mu.Unlock()

	// Check if session is expired
	if time.Now().After(metadata.ExpiresAt) {
		return nil, fmt.Errorf("session expired: %s", sessionID)
	}

	return metadata, nil
}

// UpdateSessionFrameCount updates the frame count for a session
func (sm *SessionManager) UpdateSessionFrameCount(sessionID string, frameCount int) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	metadata, exists := sm.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	metadata.FrameCount = frameCount
	metadata.LastAccess = time.Now()

	// Save to disk
	return sm.saveMetadataToDisk(metadata)
}

// UpdateSessionDimensions updates the width and height for a session
func (sm *SessionManager) UpdateSessionDimensions(sessionID string, width, height int) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	metadata, exists := sm.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	metadata.Width = width
	metadata.Height = height
	metadata.LastAccess = time.Now()

	// Save to disk
	return sm.saveMetadataToDisk(metadata)
}

// EndSession ends a session and removes its data
func (sm *SessionManager) EndSession(sessionID string) error {
	if err := ValidateSessionID(sessionID); err != nil {
		return err
	}

	sm.mu.Lock()
	defer sm.mu.Unlock()

	// Remove from memory
	delete(sm.sessions, sessionID)

	// Delete from disk
	sessionPath := filepath.Join(sm.baseDir, sessionID)
	if err := os.RemoveAll(sessionPath); err != nil {
		return fmt.Errorf("failed to delete session directory: %w", err)
	}

	return nil
}

// ListSessions returns all active session IDs
func (sm *SessionManager) ListSessions() []string {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	sessionIDs := make([]string, 0, len(sm.sessions))
	for id := range sm.sessions {
		sessionIDs = append(sessionIDs, id)
	}
	return sessionIDs
}

// LoadSessionsFromDisk loads all sessions from disk on server startup
func (sm *SessionManager) LoadSessionsFromDisk() error {
	if _, err := os.Stat(sm.baseDir); os.IsNotExist(err) {
		// Base directory doesn't exist, create it
		if err := os.MkdirAll(sm.baseDir, 0755); err != nil {
			return fmt.Errorf("failed to create base directory: %w", err)
		}
		return nil
	}

	entries, err := os.ReadDir(sm.baseDir)
	if err != nil {
		return fmt.Errorf("failed to read base directory: %w", err)
	}

	loadedCount := 0
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		sessionID := entry.Name()
		if err := ValidateSessionID(sessionID); err != nil {
			// Skip invalid session directories
			continue
		}

		metadata, err := sm.loadMetadataFromDisk(sessionID)
		if err != nil {
			// Skip sessions with corrupt metadata
			continue
		}

		// Check if session is expired (including grace period)
		if time.Now().After(metadata.ExpiresAt.Add(GracePeriod)) {
			// Delete expired session
			os.RemoveAll(filepath.Join(sm.baseDir, sessionID))
			continue
		}

		sm.mu.Lock()
		sm.sessions[sessionID] = metadata
		sm.mu.Unlock()

		loadedCount++
	}

	fmt.Printf("Loaded %d sessions from disk\n", loadedCount)
	return nil
}

// saveMetadataToDisk saves session metadata to disk
func (sm *SessionManager) saveMetadataToDisk(metadata *SessionMetadata) error {
	metadataPath := filepath.Join(metadata.StoragePath, "metadata.json")

	data, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	if err := os.WriteFile(metadataPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write metadata file: %w", err)
	}

	return nil
}

// loadMetadataFromDisk loads session metadata from disk
func (sm *SessionManager) loadMetadataFromDisk(sessionID string) (*SessionMetadata, error) {
	if err := ValidateSessionID(sessionID); err != nil {
		return nil, err
	}

	sessionPath := filepath.Join(sm.baseDir, sessionID)
	metadataPath := filepath.Join(sessionPath, "metadata.json")

	data, err := os.ReadFile(metadataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read metadata file: %w", err)
	}

	var metadata SessionMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	return &metadata, nil
}
