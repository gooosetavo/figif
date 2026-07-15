# Docker Quick Start Guide

## ✅ Fixed: Import Error

The import error has been resolved! The backend code has been restructured into proper packages:
- `pkg/handlers` - HTTP handlers
- `pkg/grpcserver` - gRPC server implementation
- `pkg/processor` - Image processing logic

## 🚀 Quick Start

### Option 1: Docker (Recommended - with Live Reload)

**Start the HTTP server for frontend:**
```bash
docker compose --profile dev up
```

The server will:
- Start on `http://localhost:8080`
- Automatically reload when you edit Go files
- Show build logs in real-time

**Stop the server:**
```bash
docker compose down
```

### Option 2: Local Go (without Docker)

**Start the HTTP server:**
```bash
cd backend
make run-http
```

**Or directly:**
```bash
cd backend
go run cmd/http-server/main.go
```

The server will be available at `http://localhost:8080`

## 🧪 Test the Backend

Once the server is running, test it:

```bash
# Health check
curl http://localhost:8080/health

# Should return: {"status":"healthy","timestamp":...}
```

## 🎨 Using with Frontend

1. **Start the backend** (choose one option above)

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Open the app** in your browser

4. **Load a GIF** and go to Background Removal panel

5. **Toggle to "⚡ Backend" mode** - it should show as online!

6. **Try processing** - the work will be offloaded to your Go server

## 📊 Docker Profiles Reference

| Command | What it runs | Use case |
|---------|-------------|----------|
| `docker compose --profile dev up` | HTTP server with live reload | **Frontend development** (recommended) |
| `docker compose --profile all-dev up` | HTTP + gRPC with live reload | Full development |
| `docker compose --profile prod up` | HTTP server (production build) | Production testing |

## 🔧 Development Tips

### Watch Logs

```bash
# Follow logs in real-time
docker compose logs -f

# Watch specific service
docker compose logs -f backend-http-dev
```

### Make Changes

Just edit any `.go` file in `backend/` and Air will automatically:
1. Detect the change
2. Rebuild the server
3. Restart it

You'll see something like:
```
backend-http-dev  | building...
backend-http-dev  | running...
backend-http-dev  | HTTP server listening on port 8080
```

### Rebuild Docker Image

If you change dependencies or Dockerfile:
```bash
docker compose build
docker compose --profile dev up
```

### Access Container Shell

```bash
docker compose exec backend-http-dev sh

# Inside container:
go version
ls -la
```

## 🐛 Troubleshooting

### "Port already in use"

Something is already using port 8080:
```bash
# Find what's using it
lsof -i :8080

# Kill it or change port in docker-compose.yml
```

### "Cannot connect to backend"

1. Check if server is running:
   ```bash
   docker compose ps
   ```

2. Check logs:
   ```bash
   docker compose logs backend-http-dev
   ```

3. Test health endpoint:
   ```bash
   curl http://localhost:8080/health
   ```

### "Live reload not working"

1. Make sure you're using dev profile: `--profile dev`
2. Check Air is running: `docker compose logs backend-http-dev | grep air`
3. Try rebuilding: `docker compose down && docker compose --profile dev up --build`

### "Frontend shows 'Backend (offline)'"

1. Backend must be running on port 8080
2. Check CORS is enabled (it should be by default)
3. Check browser console for errors
4. Verify health endpoint works: `curl http://localhost:8080/health`

## 🎯 What's Next?

The backend currently has placeholder logic for background removal. To implement real processing:

1. Edit [`backend/pkg/processor/processor.go`](backend/pkg/processor/processor.go)
2. Integrate with ML model or external service
3. The changes will auto-reload if using Docker dev mode!

See [`backend/DOCKER.md`](backend/DOCKER.md) for complete Docker documentation.
