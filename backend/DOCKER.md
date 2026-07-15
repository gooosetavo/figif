# Docker Setup Guide

This guide explains how to run the FigIF backend using Docker and Docker Compose.

## Prerequisites

- Docker Desktop or Docker Engine (20.10+)
- Docker Compose (v2.0+)

## Quick Start

### Development Mode with Live Reload

**Start HTTP server (recommended for frontend development):**
```bash
docker compose --profile dev up
```

**Start both HTTP and gRPC servers:**
```bash
docker compose --profile all-dev up
```

**Start only gRPC server:**
```bash
docker compose --profile grpc-dev up
```

### Production Mode

**Start HTTP server:**
```bash
docker compose --profile prod up
```

**Start both servers:**
```bash
docker compose --profile all-prod up
```

## Available Profiles

Docker Compose uses profiles to control which services to run:

### Development Profiles (with live reload)

| Profile | Services | Ports | Use Case |
|---------|----------|-------|----------|
| `dev` | HTTP server | 8080 | Frontend development |
| `http-dev` | HTTP server | 8080 | HTTP API development |
| `grpc-dev` | gRPC server | 50051 | gRPC client development |
| `all-dev` | Both servers | 8080, 50051 | Full development |

### Production Profiles

| Profile | Services | Ports | Use Case |
|---------|----------|-------|----------|
| `prod` | HTTP server | 8080 | Production HTTP |
| `http-prod` | HTTP server | 8080 | Production HTTP only |
| `grpc-prod` | gRPC server | 50051 | Production gRPC only |
| `all-prod` | Both servers | 8080, 50051 | Full production |

## Live Reloading (Development)

In development mode, the backend automatically reloads when you change Go files:

1. Edit any `.go` file in the `backend/` directory
2. Air detects the change and rebuilds
3. The server restarts automatically

**What triggers reload:**
- `.go` files
- `.proto` files (requires manual proto regeneration)

**What doesn't trigger reload:**
- Test files (`*_test.go`)
- Generated files (`*.pb.go`)

## Volume Mounts

### Development Mode

The entire `backend/` directory is mounted as a volume:
```yaml
volumes:
  - ./backend:/app
  - backend-go-modules:/go/pkg/mod
```

This enables:
- Live reloading on code changes
- Persistent Go module cache
- Direct file editing from host

### Production Mode

No volumes are mounted. The application is fully containerized.

## Common Commands

### Start services
```bash
# Development
docker compose --profile dev up

# Production
docker compose --profile prod up

# Detached mode (background)
docker compose --profile dev up -d
```

### Stop services
```bash
docker compose down
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend-http-dev
```

### Rebuild images
```bash
# Rebuild after Dockerfile changes
docker compose build

# Force rebuild and start
docker compose --profile dev up --build
```

### Execute commands in container
```bash
# Run Go commands
docker compose exec backend-http-dev go version

# Run tests
docker compose exec backend-http-dev go test ./...

# Generate proto files manually
docker compose exec backend-http-dev make proto
```

### Clean up
```bash
# Stop and remove containers
docker compose down

# Remove volumes too
docker compose down -v

# Remove images
docker compose down --rmi all
```

## Accessing the Services

### From Host Machine (your computer)

- HTTP API: `http://localhost:8080`
- Health check: `http://localhost:8080/health`
- gRPC: `localhost:50051`

### From Frontend (browser)

The frontend is configured to connect to `http://localhost:8080` by default.

### From Another Container

Use the service name as hostname:
- HTTP: `http://backend-http-dev:8080`
- gRPC: `backend-grpc-dev:50051`

## Troubleshooting

### Port already in use

If you get "port is already allocated":

```bash
# Find what's using the port
lsof -i :8080

# Stop the process or change the port in docker-compose.yml
```

### Container won't start

```bash
# Check logs
docker compose logs backend-http-dev

# Rebuild image
docker compose build --no-cache

# Check if services are running
docker compose ps
```

### Live reload not working

1. Ensure you're using a dev profile: `--profile dev`
2. Check that volumes are mounted:
   ```bash
   docker compose exec backend-http-dev ls -la /app
   ```
3. Check Air logs:
   ```bash
   docker compose logs -f backend-http-dev
   ```

### Go modules not downloading

```bash
# Clear module cache
docker compose down -v
docker compose --profile dev up --build
```

## Configuration

### Change Ports

Edit `docker-compose.yml`:

```yaml
services:
  backend-http-dev:
    ports:
      - "3001:8080"  # Change host port (left side)
```

### Change Air Configuration

Edit `.air.toml` or `.air-grpc.toml` in the `backend/` directory.

### Environment Variables

Add to `docker-compose.yml`:

```yaml
services:
  backend-http-dev:
    environment:
      - LOG_LEVEL=debug
      - MAX_UPLOAD_SIZE=50MB
```

## Production Deployment

For production deployment:

1. **Build production images:**
   ```bash
   docker compose build backend-http backend-grpc
   ```

2. **Push to registry:**
   ```bash
   docker tag figif-backend-http your-registry/figif-backend-http:latest
   docker push your-registry/figif-backend-http:latest
   ```

3. **Deploy to server:**
   ```bash
   # On production server
   docker compose --profile prod up -d
   ```

4. **Configure reverse proxy (nginx, traefik, etc.)** to handle:
   - SSL/TLS termination
   - Load balancing
   - Rate limiting

## Best Practices

### Development

- Use `dev` profile for frontend development
- Keep services running in the background: `docker compose --profile dev up -d`
- Monitor logs: `docker compose logs -f`
- Commit `.air.toml` and `docker-compose.yml` to version control

### Production

- Use `prod` profiles
- Set up proper health checks
- Use environment variables for configuration
- Don't mount volumes in production
- Set resource limits:
  ```yaml
  services:
    backend-http:
      deploy:
        resources:
          limits:
            cpus: '0.5'
            memory: 512M
  ```

## Multi-Stage Build Benefits

The Dockerfile uses multi-stage builds:

1. **Development stage**: Includes Air for live reloading
2. **Builder stage**: Compiles Go binaries
3. **Production stage**: Minimal Alpine image (~20MB)

This approach:
- Keeps development environment consistent
- Produces small production images
- Speeds up builds with layer caching
- Separates build dependencies from runtime

## Next Steps

- [ ] Add database service to docker-compose.yml if needed
- [ ] Configure CI/CD to build and push images
- [ ] Set up Kubernetes manifests for cloud deployment
- [ ] Add Redis for caching
- [ ] Configure monitoring (Prometheus, Grafana)
