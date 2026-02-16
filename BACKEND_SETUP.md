# Backend Setup Guide

This guide will help you set up and use the Go backend for offloading heavy processing from the browser.

## Quick Start

### 1. Start the Backend Server

```bash
cd backend
make run-http
```

The HTTP server will start on `http://localhost:8080`

### 2. Use in the Frontend

1. Start your frontend dev server (in the root directory):
   ```bash
   npm run dev
   ```

2. Open the app and load a GIF

3. Go to the **Background Removal** panel

4. You'll see two processing mode buttons:
   - **🌐 In-Browser** - Uses WebAssembly model in your browser (default)
   - **⚡ Backend** - Offloads processing to the Go server (faster, requires server running)

5. Click **⚡ Backend** to switch modes

6. The app will automatically detect if the backend is available and show status

## What's Been Implemented

### Backend (Go)

- **HTTP REST API** on port 8080 for frontend communication
- **gRPC API** on port 50051 for advanced use cases
- **Background removal endpoint** (currently a placeholder - you can integrate ML models)
- **Image processing utilities** (resize, optimize GIF)
- **CORS enabled** for local development

### Frontend (React/TypeScript)

- **Processing mode context** in EditorContext
- **Backend availability detection** - automatically checks if server is running
- **Processing mode toggle** in Background Removal Panel
- **gRPC client utilities** - handles HTTP communication with backend
- **Updated background removal hooks** - support both in-browser and backend modes

## File Changes

### New Files Created

**Backend:**
- `backend/proto/image_processing.proto` - gRPC service definitions
- `backend/server/main.go` - gRPC server
- `backend/server/http_handler.go` - HTTP REST wrapper
- `backend/cmd/http-server/main.go` - HTTP server entry point
- `backend/pkg/processor/processor.go` - Image processing logic
- `backend/Makefile` - Build and run commands
- `backend/README.md` - Backend documentation
- `backend/.gitignore` - Git ignore rules

**Frontend:**
- `src/services/grpcClient.ts` - Backend client for HTTP communication

### Modified Files

**Frontend:**
- `src/contexts/EditorContext.tsx` - Added processingMode and isBackendAvailable state
- `src/hooks/useEditorState.ts` - Added processing mode state
- `src/hooks/useBackgroundRemoval.ts` - Added processingMode parameter
- `src/hooks/useBackgroundOperations.ts` - Pass processingMode to background removal
- `src/utils/backgroundRemoval.ts` - Support backend processing mode
- `src/components/Panels/BackgroundRemovalPanel.tsx` - Added processing mode toggle UI

## Backend Commands

```bash
# Install dependencies and tools
make install-tools
make deps

# Generate proto files
make proto

# Run HTTP server (for frontend)
make run-http

# Run gRPC server
make run

# Run both servers
make run-both

# Build production binaries
make build

# Clean generated files
make clean
```

## Architecture

```
Frontend (Browser)
    ↓ HTTP/JSON
Backend HTTP Server (Port 8080)
    ↓ Function calls
gRPC Server Logic
    ↓
Image Processing (pkg/processor)
```

## Next Steps

### Implement Actual Background Removal in Backend

The current backend has placeholder logic. To implement real background removal:

1. **Option 1: Use a Python ML model**
   - Call Python subprocess from Go
   - Use rembg or similar library

2. **Option 2: Use Go ML libraries**
   - Integrate with ONNX Runtime Go bindings
   - Load pre-trained models

3. **Option 3: Use external service**
   - Call external API (remove.bg, etc.)

### Example Integration

Edit `backend/pkg/processor/processor.go`:

```go
func (p *ImageProcessor) RemoveBackground(ctx context.Context, imageData []byte, format string) ([]byte, error) {
    // TODO: Integrate with actual ML model
    // For now, this is a placeholder

    // Example: Call Python script
    // cmd := exec.Command("python3", "scripts/remove_bg.py")
    // ...

    return imageData, nil
}
```

## Troubleshooting

### Backend server not starting

- Check if port 8080 is available: `lsof -i :8080`
- Try a different port: `make run-http-port PORT=3001`

### Frontend shows "Backend (offline)"

- Make sure the backend server is running: `cd backend && make run-http`
- Check console for connection errors
- Verify CORS is enabled in backend

### Processing fails in backend mode

- Check backend server logs for errors
- Ensure image data is being sent correctly
- The current backend has placeholder logic - implement actual processing

## Development Tips

- Keep backend server running during frontend development
- Backend automatically reloads on code changes if using `make run-http`
- Use browser DevTools Network tab to debug HTTP requests
- Backend logs show processing time for each request

## Production Deployment

For production, you'll want to:

1. Build optimized binaries: `make build`
2. Deploy backend to a server (VPS, cloud function, etc.)
3. Update frontend `backendClient` baseUrl to production URL
4. Add authentication/rate limiting
5. Implement actual ML model for background removal
