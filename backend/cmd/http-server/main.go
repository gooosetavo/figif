package main

import (
	"flag"
	"log"

	server "github.com/figif/backend/server"
)

var (
	port = flag.String("port", "8080", "The HTTP server port")
)

func main() {
	flag.Parse()

	log.Printf("Starting HTTP server on port %s", *port)
	if err := server.StartHTTPServer(*port); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}
