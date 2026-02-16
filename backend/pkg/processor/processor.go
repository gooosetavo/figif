package processor

import (
	"context"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"bytes"

	"github.com/nfnt/resize"
)

// ImageProcessor handles image processing operations
type ImageProcessor struct {
	// Add any shared resources, configs, or caches here
}

// New creates a new ImageProcessor
func New() *ImageProcessor {
	return &ImageProcessor{}
}

// RemoveBackground removes the background from an image
// This is a placeholder - you can integrate with actual background removal libraries
func (p *ImageProcessor) RemoveBackground(ctx context.Context, imageData []byte, format string) ([]byte, error) {
	// TODO: Implement actual background removal
	// For now, this is a placeholder that returns the original image
	// You can integrate with libraries like:
	// - rembg (Python, can be called via CGO or subprocess)
	// - or implement your own algorithm

	return imageData, nil
}

// OptimizeGIF optimizes a GIF file
func (p *ImageProcessor) OptimizeGIF(ctx context.Context, gifData []byte, quality, maxWidth, maxHeight int) ([]byte, error) {
	// Decode GIF
	reader := bytes.NewReader(gifData)
	gifImage, err := gif.DecodeAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to decode GIF: %w", err)
	}

	// Optimize each frame if dimensions are provided
	if maxWidth > 0 && maxHeight > 0 {
		for i, frame := range gifImage.Image {
			bounds := frame.Bounds()
			width := bounds.Dx()
			height := bounds.Dy()

			// Only resize if image is larger than max dimensions
			if width > maxWidth || height > maxHeight {
				resized := resize.Thumbnail(uint(maxWidth), uint(maxHeight), frame, resize.Lanczos3)

				// Convert back to paletted image
				palettedImage := image.NewPaletted(resized.Bounds(), frame.Palette)
				for y := resized.Bounds().Min.Y; y < resized.Bounds().Max.Y; y++ {
					for x := resized.Bounds().Min.X; x < resized.Bounds().Max.X; x++ {
						palettedImage.Set(x, y, resized.At(x, y))
					}
				}
				gifImage.Image[i] = palettedImage
			}
		}
	}

	// Encode optimized GIF
	var buf bytes.Buffer
	if err := gif.EncodeAll(&buf, gifImage); err != nil {
		return nil, fmt.Errorf("failed to encode GIF: %w", err)
	}

	return buf.Bytes(), nil
}

// ResizeImage resizes an image
func (p *ImageProcessor) ResizeImage(ctx context.Context, imageData []byte, width, height int, maintainAspectRatio bool) ([]byte, error) {
	// Decode image
	reader := bytes.NewReader(imageData)
	img, format, err := image.Decode(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Resize image
	var resized image.Image
	if maintainAspectRatio {
		resized = resize.Thumbnail(uint(width), uint(height), img, resize.Lanczos3)
	} else {
		resized = resize.Resize(uint(width), uint(height), img, resize.Lanczos3)
	}

	// Encode image back to original format
	var buf bytes.Buffer
	switch format {
	case "png":
		err = png.Encode(&buf, resized)
	case "jpeg", "jpg":
		err = jpeg.Encode(&buf, resized, &jpeg.Options{Quality: 90})
	default:
		// Default to PNG
		err = png.Encode(&buf, resized)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to encode image: %w", err)
	}

	return buf.Bytes(), nil
}

// ProcessFrame processes a single frame with the specified operation
func (p *ImageProcessor) ProcessFrame(ctx context.Context, frameData []byte, operation string, params map[string]string) ([]byte, error) {
	switch operation {
	case "resize":
		// Extract resize parameters
		width := 0
		height := 0
		// Parse width and height from params
		// This is a simplified version - you'd want proper parsing
		return p.ResizeImage(ctx, frameData, width, height, true)

	default:
		return nil, fmt.Errorf("unsupported operation: %s", operation)
	}
}
