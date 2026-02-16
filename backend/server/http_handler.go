package main

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	pb "github.com/figif/backend/proto"
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

// HTTPServer wraps the gRPC image processing server with HTTP handlers
type HTTPServer struct {
	grpcServer *imageProcessingServer
}

func NewHTTPServer() *HTTPServer {
	return &HTTPServer{
		grpcServer: newServer(),
	}
}

// RemoveBackgroundHandler handles HTTP requests for background removal
func (s *HTTPServer) RemoveBackgroundHandler(w http.ResponseWriter, r *http.Request) {
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

	// Call gRPC service
	grpcReq := &pb.RemoveBackgroundRequest{
		ImageData: imageData,
		Format:    req.Format,
	}

	grpcResp, err := s.grpcServer.RemoveBackground(r.Context(), grpcReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Encode response
	processedImage := base64.StdEncoding.EncodeToString(grpcResp.ProcessedImage)

	resp := RemoveBackgroundResponse{
		ProcessedImage:   processedImage,
		Error:            grpcResp.Error,
		ProcessingTimeMs: grpcResp.ProcessingTimeMs,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	json.NewEncoder(w).Encode(resp)
}

// HealthHandler handles health check requests
func (s *HTTPServer) HealthHandler(w http.ResponseWriter, r *http.Request) {
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

// StartHTTPServer starts the HTTP server
func StartHTTPServer(port string) error {
	server := NewHTTPServer()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", CORSMiddleware(server.HealthHandler))
	mux.HandleFunc("/api/remove-background", CORSMiddleware(server.RemoveBackgroundHandler))

	log.Printf("HTTP server listening on port %s", port)
	return http.ListenAndServe(":"+port, mux)
}
