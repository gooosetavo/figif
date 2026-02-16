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

# Run the server
run:
	@echo "Starting gRPC server..."
	go run server/main.go

# Build the server
build:
	@echo "Building server..."
	go build -o bin/server server/main.go

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
run-port:
	@echo "Starting gRPC server on port $(PORT)..."
	go run server/main.go -port=$(PORT)
