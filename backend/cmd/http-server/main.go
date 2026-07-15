package main

import (
	"crypto/rand"
	"encoding/hex"
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/figif/backend/pkg/handlers"
	"github.com/figif/backend/pkg/session"
	"github.com/figif/backend/pkg/storage"
	"github.com/joho/godotenv"
)

var (
	port           = flag.String("port", "8080", "The HTTP server port")
	sessionsDir    = flag.String("sessions-dir", "./sessions", "Directory for session storage")
	jwtSecret      = flag.String("jwt-secret", "", "JWT signing secret (auto-generated if not provided)")
	cleanupInterval = flag.Duration("cleanup-interval", 1*time.Hour, "Interval for session cleanup")
)

func main() {
	flag.Parse()

	// Load .env file if it exists (optional - env vars can also be set system-wide)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	} else {
		log.Println("✓ Loaded configuration from .env file")
	}

	// Load or generate JWT secret
	secretKey := loadOrGenerateSecret()

	// Initialize session manager
	sessionManager := session.NewSessionManager(secretKey, *sessionsDir)

	// Load existing sessions from disk
	if err := sessionManager.LoadSessionsFromDisk(); err != nil {
		log.Printf("Warning: Failed to load sessions from disk: %v", err)
	}

	// Initialize frame storage
	frameStorage := storage.NewFrameStorage(*sessionsDir)

	// Initialize quota manager
	quotaManager := storage.NewQuotaManager(frameStorage)

	// Initialize HTTP handler with session support
	httpHandler := handlers.NewHTTPHandlerWithSession(sessionManager, frameStorage, quotaManager)

	// Initialize session handler
	sessionHandler := handlers.NewSessionHandler(sessionManager, frameStorage, quotaManager)

	// Start cleanup service
	cleanupService := session.NewCleanupService(sessionManager, *cleanupInterval)
	cleanupService.Start()
	defer cleanupService.Stop()

	// Create HTTP multiplexer
	mux := http.NewServeMux()

	// Health endpoint (no auth required)
	mux.HandleFunc("/health", handlers.CORSMiddleware(httpHandler.HealthHandler))

	// Legacy stateless endpoints (no auth required - backward compatible)
	mux.HandleFunc("/api/remove-background", handlers.CORSMiddleware(httpHandler.RemoveBackgroundHandler))
	mux.HandleFunc("/api/manual-remove-background", handlers.CORSMiddleware(httpHandler.ManualRemoveBackgroundHandler))

	// Session management endpoints
	mux.HandleFunc("/api/session/create", handlers.CORSMiddleware(sessionHandler.CreateSessionHandler))

	// Session endpoints with authentication
	authMiddleware := handlers.AuthMiddleware(sessionManager)
	mux.Handle("/api/session/upload", handlers.CORSMiddleware(authMiddleware(http.HandlerFunc(sessionHandler.UploadFramesHandler)).ServeHTTP))
	mux.Handle("/api/session/info", handlers.CORSMiddleware(authMiddleware(http.HandlerFunc(sessionHandler.GetSessionInfoHandler)).ServeHTTP))
	mux.Handle("/api/session/refresh", handlers.CORSMiddleware(authMiddleware(http.HandlerFunc(sessionHandler.RefreshTokenHandler)).ServeHTTP))
	mux.Handle("/api/session/end", handlers.CORSMiddleware(authMiddleware(http.HandlerFunc(sessionHandler.EndSessionHandler)).ServeHTTP))
	mux.Handle("/api/session/quota", handlers.CORSMiddleware(authMiddleware(http.HandlerFunc(sessionHandler.GetQuotaInfoHandler)).ServeHTTP))

	// Session-based frame operations (pattern matching for /api/session/frame/:id)
	mux.Handle("/api/session/frame/", handlers.CORSMiddleware(authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Route to appropriate handler based on path suffix
		if len(r.URL.Path) > len("/api/session/frame/") {
			if r.URL.Path[len(r.URL.Path)-10:] == "/remove-bg" {
				httpHandler.SessionRemoveBackgroundHandler(w, r)
			} else if r.URL.Path[len(r.URL.Path)-14:] == "/manual-remove" {
				httpHandler.SessionManualRemoveBackgroundHandler(w, r)
			} else {
				// Default: GET frame endpoint
				sessionHandler.GetFrameHandler(w, r)
			}
		} else {
			http.Error(w, "Invalid frame endpoint", http.StatusNotFound)
		}
	})).ServeHTTP))

	log.Println("=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=")
	log.Printf("🚀 FiGif Backend Server Starting")
	log.Println("=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=")
	log.Printf("📍 HTTP server: http://localhost:%s", *port)
	log.Printf("💚 Health check: http://localhost:%s/health", *port)
	log.Printf("📁 Sessions directory: %s", *sessionsDir)
	log.Printf("🧹 Cleanup interval: %s", *cleanupInterval)
	log.Println()
	log.Println("📡 Available Endpoints:")
	log.Println("   Stateless (legacy):")
	log.Printf("     POST /api/remove-background")
	log.Printf("     POST /api/manual-remove-background")
	log.Println("   Session-based:")
	log.Printf("     POST /api/session/create")
	log.Printf("     POST /api/session/upload (requires auth)")
	log.Printf("     GET  /api/session/info (requires auth)")
	log.Printf("     POST /api/session/refresh (requires auth)")
	log.Printf("     GET  /api/session/quota (requires auth)")
	log.Printf("     POST /api/session/frame/:id/remove-bg (requires auth)")
	log.Printf("     POST /api/session/frame/:id/manual-remove (requires auth)")
	log.Printf("     GET  /api/session/frame/:id?type=processed (requires auth)")
	log.Printf("     DELETE /api/session/end (requires auth)")
	log.Println("=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=" + "=")

	if err := http.ListenAndServe(":"+*port, mux); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}

// loadOrGenerateSecret loads JWT secret from environment or generates a new one
func loadOrGenerateSecret() []byte {
	// Check flag first
	if *jwtSecret != "" {
		return []byte(*jwtSecret)
	}

	// Check environment variable
	if secret := os.Getenv("SESSION_SECRET"); secret != "" {
		log.Println("Using SESSION_SECRET from environment")
		return []byte(secret)
	}

	// Generate new secret
	log.Println("⚠️  No SESSION_SECRET found, generating random key...")
	log.Println("⚠️  For production, set SESSION_SECRET environment variable!")

	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		log.Fatalf("Failed to generate secret key: %v", err)
	}

	secret := hex.EncodeToString(bytes)
	log.Printf("Generated secret: %s", secret)
	log.Println("Add to your .env file: SESSION_SECRET=" + secret)

	return []byte(secret)
}
