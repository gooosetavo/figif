package processor

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
	"math/rand"
)

// SelectionPoint represents a point selected by the magic wand
type SelectionPoint struct {
	X         int
	Y         int
	Tolerance int
}

// ManualRemoveBackground performs manual background removal using magic wand selections
func (p *ImageProcessor) ManualRemoveBackground(
	ctx context.Context,
	imageData []byte,
	width, height int,
	selections []SelectionPoint,
	invert bool,
	effect string,
) ([]byte, error) {
	// Decode image
	img, err := png.Decode(bytes.NewReader(imageData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Create RGBA image for processing
	rgba := imageToRGBA(img)

	// Create mask
	mask := make([]bool, width*height)

	// Apply each selection
	for _, sel := range selections {
		p.magicWandSelect(rgba, mask, sel.X, sel.Y, sel.Tolerance, width, height)
	}

	// Invert mask if requested
	if invert {
		for i := range mask {
			mask[i] = !mask[i]
		}
	}

	// Apply mask to remove background
	result := applyMask(rgba, mask)

	// Apply effects if specified
	if effect != "none" && effect != "" {
		result = applyEffect(result, effect)
	}

	// Encode result
	var buf bytes.Buffer
	if err := png.Encode(&buf, result); err != nil {
		return nil, fmt.Errorf("failed to encode result: %w", err)
	}

	return buf.Bytes(), nil
}

// magicWandSelect performs flood fill selection
func (p *ImageProcessor) magicWandSelect(
	img *image.RGBA,
	mask []bool,
	startX, startY, tolerance, width, height int,
) {
	if startX < 0 || startX >= width || startY < 0 || startY >= height {
		return
	}

	// Get target color
	targetColor := img.RGBAAt(startX, startY)

	// Flood fill using stack
	stack := []struct{ x, y int }{{startX, startY}}
	visited := make([]bool, width*height)

	for len(stack) > 0 {
		// Pop from stack
		pos := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		x, y := pos.x, pos.y
		if x < 0 || x >= width || y < 0 || y >= height {
			continue
		}

		pixelIndex := y*width + x
		if visited[pixelIndex] {
			continue
		}
		visited[pixelIndex] = true

		// Check color difference
		currentColor := img.RGBAAt(x, y)
		diff := colorDifference(targetColor, currentColor)

		if diff <= float64(tolerance*3) {
			mask[pixelIndex] = true

			// Add neighbors to stack
			stack = append(stack,
				struct{ x, y int }{x + 1, y},
				struct{ x, y int }{x - 1, y},
				struct{ x, y int }{x, y + 1},
				struct{ x, y int }{x, y - 1},
			)
		}
	}
}

// colorDifference calculates the difference between two colors
func colorDifference(c1, c2 color.RGBA) float64 {
	dr := float64(c1.R) - float64(c2.R)
	dg := float64(c1.G) - float64(c2.G)
	db := float64(c1.B) - float64(c2.B)
	return math.Abs(dr) + math.Abs(dg) + math.Abs(db)
}

// applyMask applies the selection mask to remove background
func applyMask(img *image.RGBA, mask []bool) *image.RGBA {
	bounds := img.Bounds()
	result := image.NewRGBA(bounds)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			pixelIndex := y*bounds.Dx() + x
			c := img.RGBAAt(x, y)

			if mask[pixelIndex] {
				// Make transparent
				result.SetRGBA(x, y, color.RGBA{0, 0, 0, 0})
			} else {
				// Keep original
				result.SetRGBA(x, y, c)
			}
		}
	}

	return result
}

// applyEffect applies visual effects to the image
func applyEffect(img *image.RGBA, effect string) *image.RGBA {
	switch effect {
	case "intensifies":
		return applyIntensifiesEffect(img)
	case "party":
		return applyPartyEffect(img)
	case "on-drugs":
		return applyOnDrugsEffect(img)
	default:
		return img
	}
}

// applyIntensifiesEffect adds shake/vibrate effect
func applyIntensifiesEffect(img *image.RGBA) *image.RGBA {
	bounds := img.Bounds()
	result := image.NewRGBA(bounds)

	// Random shake offset
	offsetX := rand.Intn(5) - 2
	offsetY := rand.Intn(5) - 2

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			srcX := x - offsetX
			srcY := y - offsetY

			if srcX >= bounds.Min.X && srcX < bounds.Max.X &&
				srcY >= bounds.Min.Y && srcY < bounds.Max.Y {
				result.Set(x, y, img.At(srcX, srcY))
			} else {
				result.Set(x, y, img.At(x, y))
			}
		}
	}

	return result
}

// applyPartyEffect adds color cycling effect
func applyPartyEffect(img *image.RGBA) *image.RGBA {
	bounds := img.Bounds()
	result := image.NewRGBA(bounds)

	// Hue shift
	hueShift := float64(rand.Intn(360))

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			c := img.RGBAAt(x, y)
			if c.A > 0 { // Only process non-transparent pixels
				r, g, b := shiftHue(c.R, c.G, c.B, hueShift)
				result.SetRGBA(x, y, color.RGBA{r, g, b, c.A})
			} else {
				result.SetRGBA(x, y, c)
			}
		}
	}

	return result
}

// applyOnDrugsEffect adds chaos mode (combination of effects)
func applyOnDrugsEffect(img *image.RGBA) *image.RGBA {
	// Apply multiple effects
	img = applyIntensifiesEffect(img)
	img = applyPartyEffect(img)

	bounds := img.Bounds()
	result := image.NewRGBA(bounds)

	// Add some distortion
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			// Wavy distortion
			offset := int(math.Sin(float64(x+y)*0.1) * 3)
			srcX := x + offset
			srcY := y

			if srcX >= bounds.Min.X && srcX < bounds.Max.X {
				result.Set(x, y, img.At(srcX, srcY))
			} else {
				result.Set(x, y, img.At(x, y))
			}
		}
	}

	return result
}

// shiftHue shifts the hue of an RGB color
func shiftHue(r, g, b uint8, shift float64) (uint8, uint8, uint8) {
	// Convert RGB to HSL
	rf := float64(r) / 255.0
	gf := float64(g) / 255.0
	bf := float64(b) / 255.0

	max := math.Max(math.Max(rf, gf), bf)
	min := math.Min(math.Min(rf, gf), bf)
	delta := max - min

	var h float64
	if delta == 0 {
		h = 0
	} else if max == rf {
		h = 60 * math.Mod((gf-bf)/delta, 6)
	} else if max == gf {
		h = 60 * ((bf-rf)/delta + 2)
	} else {
		h = 60 * ((rf-gf)/delta + 4)
	}

	if h < 0 {
		h += 360
	}

	// Shift hue
	h = math.Mod(h+shift, 360)

	l := (max + min) / 2
	var s float64
	if delta == 0 {
		s = 0
	} else {
		s = delta / (1 - math.Abs(2*l-1))
	}

	// Convert back to RGB
	c := (1 - math.Abs(2*l-1)) * s
	x := c * (1 - math.Abs(math.Mod(h/60, 2)-1))
	m := l - c/2

	var r1, g1, b1 float64
	switch {
	case h < 60:
		r1, g1, b1 = c, x, 0
	case h < 120:
		r1, g1, b1 = x, c, 0
	case h < 180:
		r1, g1, b1 = 0, c, x
	case h < 240:
		r1, g1, b1 = 0, x, c
	case h < 300:
		r1, g1, b1 = x, 0, c
	default:
		r1, g1, b1 = c, 0, x
	}

	return uint8((r1 + m) * 255),
		uint8((g1 + m) * 255),
		uint8((b1 + m) * 255)
}

// imageToRGBA converts any image to RGBA
func imageToRGBA(img image.Image) *image.RGBA {
	bounds := img.Bounds()
	rgba := image.NewRGBA(bounds)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			rgba.Set(x, y, img.At(x, y))
		}
	}

	return rgba
}
