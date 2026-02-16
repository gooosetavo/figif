package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/figif/backend/pkg/session"
	"github.com/figif/backend/pkg/storage"
)

// SessionHandler handles session-related HTTP requests
type SessionHandler struct {
	sessionManager *session.SessionManager
	frameStorage   *storage.FrameStorage
	quotaManager   *storage.QuotaManager
}

// NewSessionHandler creates a new session handler
func NewSessionHandler(
	sessionManager *session.SessionManager,
	frameStorage *storage.FrameStorage,
	quotaManager *storage.QuotaManager,
) *SessionHandler {
	return &SessionHandler{
		sessionManager: sessionManager,
		frameStorage:   frameStorage,
		quotaManager:   quotaManager,
	}
}

// CreateSessionHandler handles POST /api/session/create
func (h *SessionHandler) CreateSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req session.CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	// Determine expiration duration
	var expiresIn time.Duration
	if req.ExpiresIn > 0 {
		expiresIn = time.Duration(req.ExpiresIn) * time.Second
	} else {
		expiresIn = session.DefaultSessionTTL
	}

	// Create session
	metadata, token, err := h.sessionManager.CreateSession(req.WorkspaceID, expiresIn)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create session: %v", err), http.StatusInternalServerError)
		return
	}

	// Ensure session directories exist
	if err := h.frameStorage.EnsureSessionDirectories(metadata.SessionID); err != nil {
		// Cleanup on error
		h.sessionManager.EndSession(metadata.SessionID)
		http.Error(w, fmt.Sprintf("Failed to create session directories: %v", err), http.StatusInternalServerError)
		return
	}

	response := session.CreateSessionResponse{
		SessionToken: token,
		SessionID:    metadata.SessionID,
		ExpiresAt:    metadata.ExpiresAt.Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UploadFramesHandler handles POST /api/session/upload
func (h *SessionHandler) UploadFramesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session ID from auth middleware
	sessionID, err := GetSessionID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	startTime := time.Now()

	var req session.UploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if len(req.Frames) == 0 {
		http.Error(w, "No frames provided", http.StatusBadRequest)
		return
	}

	// Check quota before uploading
	// Estimate size based on number of frames and typical frame size
	estimatedSize := int64(len(req.Frames)) * 2 * 1024 * 1024 // 2MB per frame estimate
	canUpload, err := h.quotaManager.CanUpload(sessionID, estimatedSize)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to check quota: %v", err), http.StatusInternalServerError)
		return
	}
	if !canUpload {
		quotaInfo, _ := h.quotaManager.GetQuotaInfo(sessionID)
		http.Error(w, fmt.Sprintf("Upload would exceed storage quota. Current: %.2fMB, Max: %.2fMB",
			quotaInfo.CurrentMB, quotaInfo.MaxMB), http.StatusRequestEntityTooLarge)
		return
	}

	// Upload each frame
	var totalSize int64
	uploadedCount := 0

	for _, frameUpload := range req.Frames {
		// Decode base64 image data
		imageData, err := base64.StdEncoding.DecodeString(frameUpload.ImageData)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to decode frame %d: %v", frameUpload.Index, err), http.StatusBadRequest)
			return
		}

		// Save frame to storage
		if err := h.frameStorage.SaveFrame(sessionID, frameUpload.Index, imageData, storage.FrameTypeOriginal); err != nil {
			http.Error(w, fmt.Sprintf("Failed to save frame %d: %v", frameUpload.Index, err), http.StatusInternalServerError)
			return
		}

		totalSize += int64(len(imageData))
		uploadedCount++
	}

	// Update session metadata
	if req.Metadata.Width > 0 && req.Metadata.Height > 0 {
		h.sessionManager.UpdateSessionDimensions(sessionID, req.Metadata.Width, req.Metadata.Height)
	}

	// Update frame count
	currentFrameCount, _ := h.frameStorage.GetFrameCount(sessionID, storage.FrameTypeOriginal)
	h.sessionManager.UpdateSessionFrameCount(sessionID, currentFrameCount)

	// Check quota after upload
	if err := h.quotaManager.CheckQuota(sessionID); err != nil {
		if storage.IsQuotaExceededError(err) {
			http.Error(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		}
	}

	processingTime := time.Since(startTime).Milliseconds()

	response := session.UploadResponse{
		UploadedFrames:   uploadedCount,
		TotalSize:        totalSize,
		ProcessingTimeMs: processingTime,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetSessionInfoHandler handles GET /api/session/info
func (h *SessionHandler) GetSessionInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session ID from auth middleware
	sessionID, err := GetSessionID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get session metadata
	metadata, err := h.sessionManager.GetSession(sessionID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Session not found: %v", err), http.StatusNotFound)
		return
	}

	// Get storage usage
	storageUsed, err := h.frameStorage.GetStorageSize(sessionID)
	if err != nil {
		storageUsed = 0
	}

	response := session.SessionInfoResponse{
		SessionID:   metadata.SessionID,
		CreatedAt:   metadata.CreatedAt,
		ExpiresAt:   metadata.ExpiresAt,
		FrameCount:  metadata.FrameCount,
		Width:       metadata.Width,
		Height:      metadata.Height,
		StorageUsed: storageUsed,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// EndSessionHandler handles DELETE /api/session/end
func (h *SessionHandler) EndSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session ID from auth middleware
	sessionID, err := GetSessionID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// End session (deletes all files)
	if err := h.sessionManager.EndSession(sessionID); err != nil {
		http.Error(w, fmt.Sprintf("Failed to end session: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Session ended successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetFrameHandler handles GET /api/session/frame/:id
func (h *SessionHandler) GetFrameHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session ID from auth middleware
	sessionID, err := GetSessionID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse frame index from URL path
	// Expected format: /api/session/frame/0
	var frameIndex int
	_, err = fmt.Sscanf(r.URL.Path, "/api/session/frame/%d", &frameIndex)
	if err != nil {
		http.Error(w, "Invalid frame index", http.StatusBadRequest)
		return
	}

	// Get frame type from query parameter (default to processed)
	frameTypeStr := r.URL.Query().Get("type")
	if frameTypeStr == "" {
		frameTypeStr = "processed"
	}

	var frameType storage.FrameType
	switch frameTypeStr {
	case "original":
		frameType = storage.FrameTypeOriginal
	case "processed":
		frameType = storage.FrameTypeProcessed
	case "thumbnail":
		frameType = storage.FrameTypeThumbnail
	default:
		http.Error(w, "Invalid frame type. Must be 'original', 'processed', or 'thumbnail'", http.StatusBadRequest)
		return
	}

	// Load frame from storage
	frameData, err := h.frameStorage.LoadFrame(sessionID, frameIndex, frameType)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to load frame: %v", err), http.StatusNotFound)
		return
	}

	// Return PNG data
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(frameData)))
	w.Write(frameData)
}

// GetQuotaInfoHandler handles GET /api/session/quota
func (h *SessionHandler) GetQuotaInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session ID from auth middleware
	sessionID, err := GetSessionID(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get quota information
	quotaInfo, err := h.quotaManager.GetQuotaInfo(sessionID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get quota info: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quotaInfo)
}
