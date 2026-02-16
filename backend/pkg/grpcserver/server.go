package grpcserver

import (
	"context"
	"io"
	"log"
	"time"

	pb "github.com/figif/backend/proto"
	"github.com/figif/backend/pkg/processor"
)

type ImageProcessingServer struct {
	pb.UnimplementedImageProcessingServiceServer
	processor *processor.ImageProcessor
}

func New() *ImageProcessingServer {
	return &ImageProcessingServer{
		processor: processor.New(),
	}
}

// RemoveBackground removes the background from an image
func (s *ImageProcessingServer) RemoveBackground(ctx context.Context, req *pb.RemoveBackgroundRequest) (*pb.RemoveBackgroundResponse, error) {
	start := time.Now()
	log.Printf("RemoveBackground request received, image size: %d bytes, format: %s", len(req.ImageData), req.Format)

	processedImage, err := s.processor.RemoveBackground(ctx, req.ImageData, req.Format)

	processingTime := time.Since(start).Milliseconds()

	if err != nil {
		log.Printf("Error removing background: %v", err)
		return &pb.RemoveBackgroundResponse{
			Error:            err.Error(),
			ProcessingTimeMs: processingTime,
		}, nil
	}

	log.Printf("Background removed successfully in %dms", processingTime)
	return &pb.RemoveBackgroundResponse{
		ProcessedImage:   processedImage,
		ProcessingTimeMs: processingTime,
	}, nil
}

// OptimizeGIF optimizes a GIF file
func (s *ImageProcessingServer) OptimizeGIF(ctx context.Context, req *pb.OptimizeGIFRequest) (*pb.OptimizeGIFResponse, error) {
	start := time.Now()
	log.Printf("OptimizeGIF request received, GIF size: %d bytes, quality: %d", len(req.GifData), req.Quality)

	optimizedGIF, err := s.processor.OptimizeGIF(ctx, req.GifData, int(req.Quality), int(req.MaxWidth), int(req.MaxHeight))

	processingTime := time.Since(start).Milliseconds()

	if err != nil {
		log.Printf("Error optimizing GIF: %v", err)
		return &pb.OptimizeGIFResponse{
			Error:            err.Error(),
			ProcessingTimeMs: processingTime,
		}, nil
	}

	log.Printf("GIF optimized successfully in %dms, size: %d -> %d bytes",
		processingTime, len(req.GifData), len(optimizedGIF))

	return &pb.OptimizeGIFResponse{
		OptimizedGif:     optimizedGIF,
		OriginalSize:     int64(len(req.GifData)),
		OptimizedSize:    int64(len(optimizedGIF)),
		ProcessingTimeMs: processingTime,
	}, nil
}

// ResizeImage resizes an image
func (s *ImageProcessingServer) ResizeImage(ctx context.Context, req *pb.ResizeImageRequest) (*pb.ResizeImageResponse, error) {
	start := time.Now()
	log.Printf("ResizeImage request received, target size: %dx%d", req.Width, req.Height)

	resizedImage, err := s.processor.ResizeImage(ctx, req.ImageData, int(req.Width), int(req.Height), req.MaintainAspectRatio)

	processingTime := time.Since(start).Milliseconds()

	if err != nil {
		log.Printf("Error resizing image: %v", err)
		return &pb.ResizeImageResponse{
			Error:            err.Error(),
			ProcessingTimeMs: processingTime,
		}, nil
	}

	log.Printf("Image resized successfully in %dms", processingTime)
	return &pb.ResizeImageResponse{
		ResizedImage:     resizedImage,
		ProcessingTimeMs: processingTime,
	}, nil
}

// ProcessFrames processes multiple frames in a batch using streaming
func (s *ImageProcessingServer) ProcessFrames(stream pb.ImageProcessingService_ProcessFramesServer) error {
	log.Println("ProcessFrames stream started")
	frameCount := 0

	for {
		req, err := stream.Recv()
		if err == io.EOF {
			log.Printf("ProcessFrames stream completed, processed %d frames", frameCount)
			return nil
		}
		if err != nil {
			log.Printf("Error receiving frame: %v", err)
			return err
		}

		start := time.Now()
		processedFrame, err := s.processor.ProcessFrame(stream.Context(), req.FrameData, req.Operation, req.Params)
		processingTime := time.Since(start).Milliseconds()

		resp := &pb.ProcessFrameResponse{
			FrameIndex:       req.FrameIndex,
			ProcessingTimeMs: processingTime,
		}

		if err != nil {
			log.Printf("Error processing frame %d: %v", req.FrameIndex, err)
			resp.Error = err.Error()
		} else {
			resp.ProcessedFrame = processedFrame
		}

		if err := stream.Send(resp); err != nil {
			log.Printf("Error sending frame response: %v", err)
			return err
		}

		frameCount++
	}
}

// ManualRemoveBackground removes background using manual selections
func (s *ImageProcessingServer) ManualRemoveBackground(ctx context.Context, req *pb.ManualRemoveBackgroundRequest) (*pb.ManualRemoveBackgroundResponse, error) {
	start := time.Now()
	log.Printf("ManualRemoveBackground request received, image size: %d bytes, selections: %d", len(req.ImageData), len(req.Selections))

	// Convert proto selections to processor selections
	selections := make([]processor.SelectionPoint, len(req.Selections))
	for i, sel := range req.Selections {
		selections[i] = processor.SelectionPoint{
			X:         int(sel.X),
			Y:         int(sel.Y),
			Tolerance: int(sel.Tolerance),
		}
	}

	processedImage, err := s.processor.ManualRemoveBackground(
		ctx,
		req.ImageData,
		int(req.Width),
		int(req.Height),
		selections,
		req.Invert,
		req.Effect,
	)

	processingTime := time.Since(start).Milliseconds()

	if err != nil {
		log.Printf("Error in manual background removal: %v", err)
		return &pb.ManualRemoveBackgroundResponse{
			Error:            err.Error(),
			ProcessingTimeMs: processingTime,
		}, nil
	}

	log.Printf("Manual background removal completed in %dms", processingTime)
	return &pb.ManualRemoveBackgroundResponse{
		ProcessedImage:   processedImage,
		ProcessingTimeMs: processingTime,
	}, nil
}
