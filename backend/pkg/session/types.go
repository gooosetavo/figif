package session

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// SessionClaims represents the JWT claims for a session
type SessionClaims struct {
	SessionID  string `json:"sid"`  // Unique session identifier
	WorkspaceID string `json:"wid"`  // Optional workspace correlation
	FrameCount int    `json:"fc"`   // Number of frames
	jwt.RegisteredClaims
}

// SessionMetadata contains session information stored in memory and on disk
type SessionMetadata struct {
	SessionID   string    `json:"sessionId"`
	WorkspaceID string    `json:"workspaceId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	LastAccess  time.Time `json:"lastAccess"`
	ExpiresAt   time.Time `json:"expiresAt"`
	FrameCount  int       `json:"frameCount"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	StoragePath string    `json:"storagePath"` // Directory path for this session
}

// FrameMetadata contains information about an individual frame
type FrameMetadata struct {
	Index        int    `json:"index"`
	Delay        int    `json:"delay"`        // Frame delay in milliseconds
	DisposalType int    `json:"disposalType"` // GIF disposal type (0-3)
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	ProcessedAt  time.Time `json:"processedAt,omitempty"`
}

// UploadRequest represents the request body for frame uploads
type UploadRequest struct {
	Frames   []FrameUpload   `json:"frames"`
	Metadata FramesMetadata  `json:"metadata"`
}

// FrameUpload represents a single frame being uploaded
type FrameUpload struct {
	Index        int    `json:"index"`
	ImageData    string `json:"imageData"` // base64 encoded PNG
	Delay        int    `json:"delay"`
	DisposalType int    `json:"disposalType"`
}

// FramesMetadata contains overall metadata about the frames
type FramesMetadata struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// UploadResponse is returned after successful frame upload
type UploadResponse struct {
	UploadedFrames int   `json:"uploadedFrames"`
	TotalSize      int64 `json:"totalSize"`
	ProcessingTimeMs int64 `json:"processingTimeMs"`
}

// CreateSessionRequest represents the request to create a new session
type CreateSessionRequest struct {
	WorkspaceID string `json:"workspaceId,omitempty"`
	ExpiresIn   int64  `json:"expiresIn,omitempty"` // Optional expiration in seconds (default 24h)
}

// CreateSessionResponse is returned when a session is created
type CreateSessionResponse struct {
	SessionToken string `json:"sessionToken"` // JWT token
	SessionID    string `json:"sessionId"`
	ExpiresAt    int64  `json:"expiresAt"` // Unix timestamp
}

// SessionInfoResponse provides information about the current session
type SessionInfoResponse struct {
	SessionID   string    `json:"sessionId"`
	CreatedAt   time.Time `json:"createdAt"`
	ExpiresAt   time.Time `json:"expiresAt"`
	FrameCount  int       `json:"frameCount"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	StorageUsed int64     `json:"storageUsed"` // Bytes
}

// OperationRequest represents a request to perform an operation on stored frames
type OperationRequest struct {
	Mode   string                 `json:"mode"`   // "ai" or "manual"
	Config map[string]interface{} `json:"config,omitempty"`
}

// OperationResponse is returned after an operation completes
type OperationResponse struct {
	Success          bool  `json:"success"`
	ProcessingTimeMs int64 `json:"processingTimeMs"`
	FrameID          int   `json:"frameId,omitempty"`
}
