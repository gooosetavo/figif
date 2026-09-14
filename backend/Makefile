.PHONY: proto run build clean install-tools

# Generate proto files
proto:
	@echo "Generating gRPC code from proto files..."
	protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/image_processing.proto

# Install required tools
install-tools:
	@echo "Installing protoc-gen-go and protoc-gen-go-grpc..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Run the gRPC server
run:
	@echo "Starting gRPC server..."
	go run server/main.go

# Run the HTTP server (for frontend)
run-http:
	@echo "Starting HTTP server for frontend..."
	go run cmd/http-server/main.go

# Run both servers (recommended for development)
run-both:
	@echo "Starting both gRPC and HTTP servers..."
	@echo "Starting gRPC server on port 50051..."
	@go run server/main.go &
	@echo "Starting HTTP server on port 8080..."
	@go run cmd/http-server/main.go

# Build the servers
build:
	@echo "Building servers..."
	@mkdir -p bin
	go build -o bin/grpc-server server/main.go
	go build -o bin/http-server cmd/http-server/main.go

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -f proto/*.pb.go

# Install dependencies
deps:
	@echo "Installing Go dependencies..."
	go mod tidy
	go mod download

# Run with custom port
run-grpc-port:
	@echo "Starting gRPC server on port $(PORT)..."
	go run server/main.go -port=$(PORT)

# Run HTTP server with custom port
run-http-port:
	@echo "Starting HTTP server on port $(PORT)..."
	go run cmd/http-server/main.go -port=$(PORT)
