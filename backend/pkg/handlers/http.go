package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/figif/backend/pkg/processor"
	"github.com/figif/backend/pkg/session"
	"github.com/figif/backend/pkg/storage"
)

type RemoveBackgroundRequest struct {
	ImageData string `json:"imageData"`
	Format    string `json:"format"`
}

type RemoveBackgroundResponse struct {
	ProcessedImage   string `json:"processedImage"`
	Error            string `json:"error,omitempty"`
	ProcessingTimeMs int64  `json:"processingTimeMs"`
}

type SelectionPoint struct {
	X         int `json:"x"`
	Y         int `json:"y"`
	Tolerance int `json:"tolerance"`
}

type ManualRemoveBackgroundRequest struct {
	ImageData  string           `json:"imageData"`
	Width      int              `json:"width"`
	Height     int              `json:"height"`
	Selections []SelectionPoint `json:"selections"`
	Invert     bool             `json:"invert"`
	Effect     string           `json:"effect"`
}

type ManualRemoveBackgroundResponse struct {
	ProcessedImage   string `json:"processedImage"`
	Error            string `json:"error,omitempty"`
	ProcessingTimeMs int64  `json:"processingTimeMs"`
}

// HTTPHandler wraps the image processing functionality with HTTP handlers
type HTTPHandler struct {
	processor      *processor.ImageProcessor
	sessionManager *session.SessionManager
	frameStorage   *storage.FrameStorage
	quotaManager   *storage.QuotaManager
}

func NewHTTPHandler() *HTTPHandler {
	return &HTTPHandler{
		processor: processor.New(),
	}
}

// NewHTTPHandlerWithSession creates an HTTP handler with session support
func NewHTTPHandlerWithSession(
	sessionManager *session.SessionManager,
	frameStorage *storage.FrameStorage,
	quotaManager *storage.QuotaManager,
) *HTTPHandler {
	return &HTTPHandler{
		processor:      processor.New(),
		sessionManager: sessionManager,
		frameStorage:   frameStorage,
		quotaManager:   quotaManager,
	}
}

// RemoveBackgroundHandler handles HTTP requests for background removal
func (h *HTTPHandler) RemoveBackgroundHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RemoveBackgroundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Decode base64 image data
	imageData, err := base64.StdEncoding.DecodeString(req.ImageData)
	if err != nil {
		http.Error(w, "Invalid base64 image data", http.StatusBadRequest)
		return
	}

	// Process image
	start := time.Now()
	processedImage, err := h.processor.RemoveBackground(context.Background(), imageData, req.Format)
	processingTime := time.Since(start).Milliseconds()

	// Encode response
	var resp RemoveBackgroundResponse
	if err != nil {
		log.Printf("Error processing image: %v", err)
		resp = RemoveBackgroundResponse{
			Error:            err.Error(),
			ProcessingTimeMs: processingTime,
		}
	} else {
		encodedImage := base64.StdEncoding.EncodeToString(processedImage)
		resp = RemoveBackgroundResponse{
			ProcessedImage:   encodedImage,
			ProcessingTimeMs: processingTime,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	json.NewEncoder(w).Encode(resp)
}

// ManualRemoveBackgroundHandler handles HTTP requests for manual background removal
func (h *HTTPHandler) ManualRemoveBackgroundHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ManualRemoveBackgroundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Decode base64 image data
	imageData, err := base64.StdEncoding.DecodeString(req.ImageData)
	if err != nil {
		http.Error(w, "Invalid base64 image data", http.StatusBadRequest)
		return
	}

	// Convert selections to processor format
	selections := make([]processor.SelectionPoint, len(req.Selections))
	for i, sel := range req.Selections {
		selections[i] = processor.SelectionPoint{
			X:         sel.X,
			Y:         sel.Y,
			Tolerance: sel.Tolerance,
		}
	}

	// Process image
	start := time.Now()
	processedImage, err := h.processor.ManualRemoveBackground(
		context.Background(),
		imageData,
		req.Width,
		req.Height,
		selections,
		req.Invert,
		req.Effect,
	)
	processingTime := time.Since(start).Milliseconds()

	// Encode response
	var resp ManualRemoveBackgroundResponse
	if err != nil {
		log.Printf("Error in manual background removal: %v", err)
		resp = ManualRemoveBackgroundResponse{
			Error:            err.Error(),
			ProcessingTimeMs: processingTime,
		}
	} else {
		encodedImage := base64.StdEncoding.EncodeToString(processedImage)
		resp = ManualRemoveBackgroundResponse{
			ProcessedImage:   encodedImage,
			ProcessingTimeMs: processingTime,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	json.NewEncoder(w).Encode(resp)
}

// HealthHandler handles health check requests
func (h *HTTPHandler) HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
	}

	// Add session stats if session manager is available
	if h.sessionManager != nil {
		activeSessions := len(h.sessionManager.ListSessions())
		response["activeSessions"] = activeSessions
	}

	json.NewEncoder(w).Encode(response)
}

// SessionRemoveBackgroundHandler handles session-based background removal
// POST /api/session/frame/:id/remove-bg
func (h *HTTPHandler) SessionRemoveBackgroundHandler(w http.ResponseWriter, r *http.Request) {
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

	// Parse frame index from URL
	var frameIndex int
	_, err = fmt.Sscanf(r.URL.Path, "/api/session/frame/%d/remove-bg", &frameIndex)
	if err != nil {
		http.Error(w, "Invalid frame index in URL", http.StatusBadRequest)
		return
	}

	var req session.OperationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	// Load frame from storage
	frameData, err := h.frameStorage.LoadFrame(sessionID, frameIndex, storage.FrameTypeOriginal)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to load frame: %v", err), http.StatusNotFound)
		return
	}

	// Process image
	start := time.Now()
	processedImage, err := h.processor.RemoveBackground(context.Background(), frameData, "png")
	if err != nil {
		http.Error(w, fmt.Sprintf("Processing failed: %v", err), http.StatusInternalServerError)
		return
	}
	processingTime := time.Since(start).Milliseconds()

	// Save processed frame
	if err := h.frameStorage.SaveFrame(sessionID, frameIndex, processedImage, storage.FrameTypeProcessed); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save processed frame: %v", err), http.StatusInternalServerError)
		return
	}

	// Check quota
	if err := h.quotaManager.CheckQuota(sessionID); err != nil {
		if storage.IsQuotaExceededError(err) {
			http.Error(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		}
	}

	response := session.OperationResponse{
		Success:          true,
		ProcessingTimeMs: processingTime,
		FrameID:          frameIndex,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// SessionManualRemoveBackgroundHandler handles session-based manual background removal
// POST /api/session/frame/:id/manual-remove
func (h *HTTPHandler) SessionManualRemoveBackgroundHandler(w http.ResponseWriter, r *http.Request) {
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

	// Parse frame index from URL
	var frameIndex int
	_, err = fmt.Sscanf(r.URL.Path, "/api/session/frame/%d/manual-remove", &frameIndex)
	if err != nil {
		http.Error(w, "Invalid frame index in URL", http.StatusBadRequest)
		return
	}

	var req struct {
		Selections []SelectionPoint `json:"selections"`
		Invert     bool             `json:"invert"`
		Effect     string           `json:"effect"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	// Load frame from storage
	frameData, err := h.frameStorage.LoadFrame(sessionID, frameIndex, storage.FrameTypeOriginal)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to load frame: %v", err), http.StatusNotFound)
		return
	}

	// Get session metadata for dimensions
	metadata, err := h.sessionManager.GetSession(sessionID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get session: %v", err), http.StatusInternalServerError)
		return
	}

	// Convert selections to processor format
	selections := make([]processor.SelectionPoint, len(req.Selections))
	for i, sel := range req.Selections {
		selections[i] = processor.SelectionPoint{
			X:         sel.X,
			Y:         sel.Y,
			Tolerance: sel.Tolerance,
		}
	}

	// Process image
	start := time.Now()
	processedImage, err := h.processor.ManualRemoveBackground(
		context.Background(),
		frameData,
		metadata.Width,
		metadata.Height,
		selections,
		req.Invert,
		req.Effect,
	)
	if err != nil {
		http.Error(w, fmt.Sprintf("Processing failed: %v", err), http.StatusInternalServerError)
		return
	}
	processingTime := time.Since(start).Milliseconds()

	// Save processed frame
	if err := h.frameStorage.SaveFrame(sessionID, frameIndex, processedImage, storage.FrameTypeProcessed); err != nil {
		http.Error(w, fmt.Sprintf("Failed to save processed frame: %v", err), http.StatusInternalServerError)
		return
	}

	// Check quota
	if err := h.quotaManager.CheckQuota(sessionID); err != nil {
		if storage.IsQuotaExceededError(err) {
			http.Error(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		}
	}

	response := session.OperationResponse{
		Success:          true,
		ProcessingTimeMs: processingTime,
		FrameID:          frameIndex,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CORSMiddleware handles CORS preflight requests
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
