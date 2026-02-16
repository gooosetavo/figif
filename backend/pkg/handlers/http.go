package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	pb "github.com/figif/backend/proto"
	"github.com/figif/backend/pkg/processor"
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

// HTTPHandler wraps the image processing functionality with HTTP handlers
type HTTPHandler struct {
	processor *processor.ImageProcessor
}

func NewHTTPHandler() *HTTPHandler {
	return &HTTPHandler{
		processor: processor.New(),
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

// HealthHandler handles health check requests
func (h *HTTPHandler) HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
	})
}

// CORSMiddleware handles CORS preflight requests
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
