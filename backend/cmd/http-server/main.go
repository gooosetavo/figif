package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/figif/backend/pkg/handlers"
)

var (
	port = flag.String("port", "8080", "The HTTP server port")
)

func main() {
	flag.Parse()

	handler := handlers.NewHTTPHandler()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handlers.CORSMiddleware(handler.HealthHandler))
	mux.HandleFunc("/api/remove-background", handlers.CORSMiddleware(handler.RemoveBackgroundHandler))
	mux.HandleFunc("/api/manual-remove-background", handlers.CORSMiddleware(handler.ManualRemoveBackgroundHandler))

	log.Printf("HTTP server listening on port %s", *port)
	log.Printf("Health check: http://localhost:%s/health", *port)
	log.Printf("API endpoint: http://localhost:%s/api/remove-background", *port)

	if err := http.ListenAndServe(":"+*port, mux); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}
