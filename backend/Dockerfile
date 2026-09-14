# Multi-stage Dockerfile for Go backend

# Stage 1: Development with live reload
FROM golang:1.23-alpine AS development

WORKDIR /app

# Install air for live reloading
RUN go install github.com/air-verse/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Generate proto files
RUN apk add --no-cache protobuf protobuf-dev && \
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest && \
    protoc --go_out=. --go_opt=paths=source_relative \
           --go-grpc_out=. --go-grpc_opt=paths=source_relative \
           proto/image_processing.proto

# Expose ports
EXPOSE 50051 8080

# Air will handle live reloading
CMD ["air", "-c", ".air.toml"]

# Stage 2: Builder for production
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git protobuf protobuf-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Generate proto files
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest && \
    protoc --go_out=. --go_opt=paths=source_relative \
           --go-grpc_out=. --go-grpc_opt=paths=source_relative \
           proto/image_processing.proto

# Build gRPC server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /grpc-server server/main.go

# Build HTTP server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /http-server cmd/http-server/main.go

# Stage 3: Production image
FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binaries from builder
COPY --from=builder /grpc-server .
COPY --from=builder /http-server .

# Expose ports
EXPOSE 50051 8080

# Default to HTTP server (can be overridden)
CMD ["./http-server"]
