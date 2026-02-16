# FigIF Backend

Go backend server for offloading heavy image processing tasks from the browser.

Provides both gRPC and HTTP/REST APIs for flexibility.

## Features

- **Background Removal**: Remove backgrounds from images
- **GIF Optimization**: Optimize and resize GIF files
- **Image Resizing**: Resize images with aspect ratio control
- **Batch Frame Processing**: Process multiple frames using streaming gRPC
- **HTTP API**: RESTful endpoints for easy frontend integration
- **gRPC API**: High-performance RPC for advanced use cases

## Quick Start with Docker (Recommended)

**Development with live reload:**
```bash
cd ..  # Go to project root
docker compose --profile dev up
```

See [DOCKER.md](DOCKER.md) for complete Docker documentation.

---

## Manual Setup (without Docker)

### Prerequisites

- Go 1.21 or later
- Protocol Buffers compiler (protoc)
- gRPC tools

### Install Protocol Buffers Compiler

**macOS:**
```bash
brew install protobuf
```

**Linux:**
```bash
sudo apt-get install -y protobuf-compiler
```

## Setup

1. **Install Go dependencies and gRPC tools:**
```bash
cd backend
make install-tools
make deps
```

2. **Generate gRPC code from proto files:**
```bash
make proto
```

## Running the Server

### For Frontend Development (HTTP Server)

The HTTP server is designed for the frontend to communicate with:

```bash
make run-http
```

This starts an HTTP server on port 8080 with CORS enabled.

**Or with custom port:**
```bash
make run-http-port PORT=3001
```

### For gRPC Clients (gRPC Server)

```bash
make run
```

This starts a gRPC server on port 50051.

### Run Both Servers

For full functionality:
```bash
make run-both
```

This starts:
- gRPC server on port 50051
- HTTP server on port 8080

## Building

Build a production binary:
```bash
make build
```

This creates `bin/server` executable.

## Project Structure

```
backend/
├── proto/                      # Protocol Buffer definitions
│   └── image_processing.proto  # gRPC service definitions
├── server/                     # Server implementations
│   ├── main.go                 # gRPC server entry point
│   └── http_handler.go         # HTTP/REST handlers
├── cmd/                        # Command-line applications
│   └── http-server/            # HTTP server
│       └── main.go
├── pkg/                        # Packages
│   └── processor/              # Image processing logic
│       └── processor.go
├── bin/                        # Build artifacts (ignored)
├── Makefile                    # Build and run commands
└── README.md                   # This file
```

## API Services

### ImageProcessingService

#### RemoveBackground
Removes the background from an image.

```protobuf
rpc RemoveBackground(RemoveBackgroundRequest) returns (RemoveBackgroundResponse);
```

#### OptimizeGIF
Optimizes a GIF file with quality and size constraints.

```protobuf
rpc OptimizeGIF(OptimizeGIFRequest) returns (OptimizeGIFResponse);
```

#### ResizeImage
Resizes an image with optional aspect ratio maintenance.

```protobuf
rpc ResizeImage(ResizeImageRequest) returns (ResizeImageResponse);
```

#### ProcessFrames (Streaming)
Processes multiple frames in batch using bidirectional streaming.

```protobuf
rpc ProcessFrames(stream ProcessFrameRequest) returns (stream ProcessFrameResponse);
```

## Testing with grpcurl

The server has gRPC reflection enabled for debugging:

```bash
# List available services
grpcurl -plaintext localhost:50051 list

# Describe a service
grpcurl -plaintext localhost:50051 describe imageprocessing.ImageProcessingService

# Call a method (example)
grpcurl -plaintext -d '{"image_data": "..."}' \
  localhost:50051 imageprocessing.ImageProcessingService/ResizeImage
```

## Configuration

Server configuration options:
- `-port`: Server port (default: 50051)
- Max message size: 50MB (configured in server initialization)

## Development

### Adding New Processing Features

1. Update `proto/image_processing.proto` with new RPC methods
2. Run `make proto` to regenerate Go code
3. Implement the method in `server/main.go`
4. Add processing logic in `pkg/processor/processor.go`

### Cleaning Up

Remove generated files and build artifacts:
```bash
make clean
```

## Frontend Integration

The frontend is already configured to communicate with the HTTP server.

### HTTP API Endpoints

**Health Check:**
```
GET http://localhost:8080/health
```

**Remove Background:**
```
POST http://localhost:8080/api/remove-background
Content-Type: application/json

{
  "imageData": "base64-encoded-image",
  "format": "png"
}
```

Response:
```json
{
  "processedImage": "base64-encoded-result",
  "processingTimeMs": 1234,
  "error": ""
}
```

### Using in the FigIF App

1. Start the HTTP server:
   ```bash
   cd backend
   make run-http
   ```

2. In the FigIF app, click on "Background Removal" panel
3. Toggle to "⚡ Backend" mode
4. The app will automatically detect the backend server and use it for processing

## Performance Notes

- The server supports messages up to 50MB
- Uses efficient streaming for batch operations
- Logs processing time for each operation
- Can handle concurrent requests

## Next Steps

- [ ] Implement actual background removal (integrate with ML model)
- [ ] Add authentication/authorization
- [ ] Add rate limiting
- [ ] Deploy with Docker
- [ ] Add monitoring and metrics
- [ ] Implement caching layer
