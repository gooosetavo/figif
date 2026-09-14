package storage

import (
	"fmt"
)

const (
	// MaxSessionStorageMB is the maximum storage allowed per session in megabytes
	MaxSessionStorageMB = 500

	// MaxSessionStorageBytes is the maximum storage allowed per session in bytes
	MaxSessionStorageBytes = MaxSessionStorageMB * 1024 * 1024
)

// QuotaManager manages storage quotas for sessions
type QuotaManager struct {
	frameStorage *FrameStorage
	maxBytes     int64
}

// NewQuotaManager creates a new quota manager
func NewQuotaManager(frameStorage *FrameStorage) *QuotaManager {
	return &QuotaManager{
		frameStorage: frameStorage,
		maxBytes:     MaxSessionStorageBytes,
	}
}

// NewQuotaManagerWithLimit creates a new quota manager with a custom limit
func NewQuotaManagerWithLimit(frameStorage *FrameStorage, maxBytes int64) *QuotaManager {
	return &QuotaManager{
		frameStorage: frameStorage,
		maxBytes:     maxBytes,
	}
}

// CheckQuota verifies that a session has not exceeded its storage quota
func (qm *QuotaManager) CheckQuota(sessionID string) error {
	currentSize, err := qm.frameStorage.GetStorageSize(sessionID)
	if err != nil {
		return fmt.Errorf("failed to get storage size: %w", err)
	}

	if currentSize > qm.maxBytes {
		return &QuotaExceededError{
			SessionID:   sessionID,
			CurrentSize: currentSize,
			MaxSize:     qm.maxBytes,
		}
	}

	return nil
}

// GetUsage returns current storage usage for a session
func (qm *QuotaManager) GetUsage(sessionID string) (int64, error) {
	return qm.frameStorage.GetStorageSize(sessionID)
}

// GetUsagePercent returns the storage usage as a percentage of the quota
func (qm *QuotaManager) GetUsagePercent(sessionID string) (float64, error) {
	currentSize, err := qm.GetUsage(sessionID)
	if err != nil {
		return 0, err
	}

	return (float64(currentSize) / float64(qm.maxBytes)) * 100, nil
}

// GetRemainingBytes returns how many bytes are remaining before hitting the quota
func (qm *QuotaManager) GetRemainingBytes(sessionID string) (int64, error) {
	currentSize, err := qm.GetUsage(sessionID)
	if err != nil {
		return 0, err
	}

	remaining := qm.maxBytes - currentSize
	if remaining < 0 {
		return 0, nil
	}

	return remaining, nil
}

// CanUpload checks if a new upload of the given size would exceed the quota
func (qm *QuotaManager) CanUpload(sessionID string, uploadSize int64) (bool, error) {
	currentSize, err := qm.GetUsage(sessionID)
	if err != nil {
		return false, err
	}

	return currentSize+uploadSize <= qm.maxBytes, nil
}

// QuotaExceededError is returned when a session exceeds its storage quota
type QuotaExceededError struct {
	SessionID   string
	CurrentSize int64
	MaxSize     int64
}

func (e *QuotaExceededError) Error() string {
	currentMB := float64(e.CurrentSize) / (1024 * 1024)
	maxMB := float64(e.MaxSize) / (1024 * 1024)
	return fmt.Sprintf("session %s storage quota exceeded: %.2fMB / %.2fMB", e.SessionID, currentMB, maxMB)
}

// IsQuotaExceededError checks if an error is a QuotaExceededError
func IsQuotaExceededError(err error) bool {
	_, ok := err.(*QuotaExceededError)
	return ok
}

// GetQuotaInfo returns detailed quota information for a session
type QuotaInfo struct {
	SessionID      string  `json:"sessionId"`
	CurrentBytes   int64   `json:"currentBytes"`
	CurrentMB      float64 `json:"currentMB"`
	MaxBytes       int64   `json:"maxBytes"`
	MaxMB          float64 `json:"maxMB"`
	RemainingBytes int64   `json:"remainingBytes"`
	RemainingMB    float64 `json:"remainingMB"`
	UsagePercent   float64 `json:"usagePercent"`
}

// GetQuotaInfo returns detailed quota information
func (qm *QuotaManager) GetQuotaInfo(sessionID string) (*QuotaInfo, error) {
	currentBytes, err := qm.GetUsage(sessionID)
	if err != nil {
		return nil, err
	}

	remainingBytes, err := qm.GetRemainingBytes(sessionID)
	if err != nil {
		return nil, err
	}

	usagePercent, err := qm.GetUsagePercent(sessionID)
	if err != nil {
		return nil, err
	}

	return &QuotaInfo{
		SessionID:      sessionID,
		CurrentBytes:   currentBytes,
		CurrentMB:      float64(currentBytes) / (1024 * 1024),
		MaxBytes:       qm.maxBytes,
		MaxMB:          float64(qm.maxBytes) / (1024 * 1024),
		RemainingBytes: remainingBytes,
		RemainingMB:    float64(remainingBytes) / (1024 * 1024),
		UsagePercent:   usagePercent,
	}, nil
}
