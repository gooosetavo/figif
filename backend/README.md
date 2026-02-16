# FigIF Backend

Go backend server using gRPC for offloading heavy image processing tasks from the browser.

## Features

- **Background Removal**: Remove backgrounds from images
- **GIF Optimization**: Optimize and resize GIF files
- **Image Resizing**: Resize images with aspect ratio control
- **Batch Frame Processing**: Process multiple frames using streaming gRPC

## Prerequisites

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

**Default port (50051):**
```bash
make run
```

**Custom port:**
```bash
make run-port PORT=8080
```

**Or directly with go run:**
```bash
go run server/main.go -port=50051
```

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
├── server/                     # Server implementation
│   └── main.go                 # Main server entry point
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

To use this backend from your frontend:

1. Install gRPC-web or use a gRPC proxy
2. Generate TypeScript clients from the proto file
3. Configure the frontend to connect to `localhost:50051`

Example with grpc-web:
```bash
npm install grpc-web google-protobuf
```

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
