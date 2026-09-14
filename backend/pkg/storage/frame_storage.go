package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

// FrameType represents the type of frame being stored
type FrameType string

const (
	FrameTypeOriginal  FrameType = "original"
	FrameTypeProcessed FrameType = "processed"
	FrameTypeThumbnail FrameType = "thumbnail"
)

// FrameStorage manages file storage for session frames
type FrameStorage struct {
	basePath string
}

// NewFrameStorage creates a new frame storage manager
func NewFrameStorage(basePath string) *FrameStorage {
	return &FrameStorage{
		basePath: basePath,
	}
}

// ValidateSessionID ensures session ID is safe for file operations
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

// SaveFrame saves a frame to disk as PNG
func (fs *FrameStorage) SaveFrame(sessionID string, frameIndex int, data []byte, frameType FrameType) error {
	if err := ValidateSessionID(sessionID); err != nil {
		return fmt.Errorf("invalid session ID: %w", err)
	}

	if frameIndex < 0 {
		return fmt.Errorf("invalid frame index: %d", frameIndex)
	}

	// Get the directory path for this frame type
	dirPath := filepath.Join(fs.basePath, sessionID, string(frameType))

	// Create directory if it doesn't exist
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Write frame file
	framePath := fs.GetFramePath(sessionID, frameIndex, frameType)
	if err := os.WriteFile(framePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write frame file: %w", err)
	}

	return nil
}

// LoadFrame loads a frame from disk
func (fs *FrameStorage) LoadFrame(sessionID string, frameIndex int, frameType FrameType) ([]byte, error) {
	if err := ValidateSessionID(sessionID); err != nil {
		return nil, fmt.Errorf("invalid session ID: %w", err)
	}

	if frameIndex < 0 {
		return nil, fmt.Errorf("invalid frame index: %d", frameIndex)
	}

	framePath := fs.GetFramePath(sessionID, frameIndex, frameType)

	data, err := os.ReadFile(framePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("frame not found: %s", framePath)
		}
		return nil, fmt.Errorf("failed to read frame file: %w", err)
	}

	return data, nil
}

// FrameExists checks if a frame file exists
func (fs *FrameStorage) FrameExists(sessionID string, frameIndex int, frameType FrameType) bool {
	if err := ValidateSessionID(sessionID); err != nil {
		return false
	}

	framePath := fs.GetFramePath(sessionID, frameIndex, frameType)
	_, err := os.Stat(framePath)
	return err == nil
}

// DeleteFrame removes a specific frame file
func (fs *FrameStorage) DeleteFrame(sessionID string, frameIndex int, frameType FrameType) error {
	if err := ValidateSessionID(sessionID); err != nil {
		return fmt.Errorf("invalid session ID: %w", err)
	}

	framePath := fs.GetFramePath(sessionID, frameIndex, frameType)

	if err := os.Remove(framePath); err != nil {
		if os.IsNotExist(err) {
			return nil // Already deleted
		}
		return fmt.Errorf("failed to delete frame: %w", err)
	}

	return nil
}

// DeleteSession removes all files for a session
func (fs *FrameStorage) DeleteSession(sessionID string) error {
	if err := ValidateSessionID(sessionID); err != nil {
		return fmt.Errorf("invalid session ID: %w", err)
	}

	sessionPath := filepath.Join(fs.basePath, sessionID)

	if err := os.RemoveAll(sessionPath); err != nil {
		return fmt.Errorf("failed to delete session directory: %w", err)
	}

	return nil
}

// GetFramePath returns the file path for a specific frame
func (fs *FrameStorage) GetFramePath(sessionID string, frameIndex int, frameType FrameType) string {
	return filepath.Join(
		fs.basePath,
		sessionID,
		string(frameType),
		fmt.Sprintf("frame_%04d.png", frameIndex),
	)
}

// GetSessionPath returns the root directory path for a session
func (fs *FrameStorage) GetSessionPath(sessionID string) string {
	return filepath.Join(fs.basePath, sessionID)
}

// ListFrames returns a list of frame indices for a given session and frame type
func (fs *FrameStorage) ListFrames(sessionID string, frameType FrameType) ([]int, error) {
	if err := ValidateSessionID(sessionID); err != nil {
		return nil, fmt.Errorf("invalid session ID: %w", err)
	}

	dirPath := filepath.Join(fs.basePath, sessionID, string(frameType))

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		if os.IsNotExist(err) {
			return []int{}, nil // No frames yet
		}
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	frameIndices := []int{}
	framePattern := regexp.MustCompile(`^frame_(\d{4})\.png$`)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		matches := framePattern.FindStringSubmatch(entry.Name())
		if matches == nil {
			continue
		}

		var frameIndex int
		fmt.Sscanf(matches[1], "%d", &frameIndex)
		frameIndices = append(frameIndices, frameIndex)
	}

	return frameIndices, nil
}

// GetStorageSize calculates the total storage used by a session in bytes
func (fs *FrameStorage) GetStorageSize(sessionID string) (int64, error) {
	if err := ValidateSessionID(sessionID); err != nil {
		return 0, fmt.Errorf("invalid session ID: %w", err)
	}

	sessionPath := filepath.Join(fs.basePath, sessionID)

	var totalSize int64

	err := filepath.WalkDir(sessionPath, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() {
			info, err := d.Info()
			if err != nil {
				return err
			}
			totalSize += info.Size()
		}

		return nil
	})

	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil // Session doesn't exist
		}
		return 0, fmt.Errorf("failed to calculate storage size: %w", err)
	}

	return totalSize, nil
}

// GetFrameCount returns the number of frames of a given type for a session
func (fs *FrameStorage) GetFrameCount(sessionID string, frameType FrameType) (int, error) {
	frames, err := fs.ListFrames(sessionID, frameType)
	if err != nil {
		return 0, err
	}
	return len(frames), nil
}

// CopyFrame copies a frame from one type to another (e.g., original → processed)
func (fs *FrameStorage) CopyFrame(sessionID string, frameIndex int, fromType, toType FrameType) error {
	data, err := fs.LoadFrame(sessionID, frameIndex, fromType)
	if err != nil {
		return fmt.Errorf("failed to load source frame: %w", err)
	}

	if err := fs.SaveFrame(sessionID, frameIndex, data, toType); err != nil {
		return fmt.Errorf("failed to save destination frame: %w", err)
	}

	return nil
}

// EnsureSessionDirectories creates all necessary directories for a session
func (fs *FrameStorage) EnsureSessionDirectories(sessionID string) error {
	if err := ValidateSessionID(sessionID); err != nil {
		return fmt.Errorf("invalid session ID: %w", err)
	}

	frameTypes := []FrameType{FrameTypeOriginal, FrameTypeProcessed, FrameTypeThumbnail}

	for _, frameType := range frameTypes {
		dirPath := filepath.Join(fs.basePath, sessionID, string(frameType))
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			return fmt.Errorf("failed to create directory for %s: %w", frameType, err)
		}
	}

	return nil
}
