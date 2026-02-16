package main

import (
	"flag"
	"fmt"
	"log"
	"net"

	pb "github.com/figif/backend/proto"
	"github.com/figif/backend/pkg/grpcserver"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

var (
	port = flag.Int("port", 50051, "The server port")
)

func main() {
	flag.Parse()

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Create gRPC server with options
	grpcServer := grpc.NewServer(
		grpc.MaxRecvMsgSize(50 * 1024 * 1024), // 50MB max receive
		grpc.MaxSendMsgSize(50 * 1024 * 1024), // 50MB max send
	)

	pb.RegisterImageProcessingServiceServer(grpcServer, grpcserver.New())

	// Register reflection service for debugging with grpcurl
	reflection.Register(grpcServer)

	log.Printf("gRPC server listening at %v", lis.Addr())
	log.Printf("Server ready to accept connections on port %d", *port)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
