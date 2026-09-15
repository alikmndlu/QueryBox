package appicon

import (
	"bytes"
	"encoding/binary"
	"image"
	"image/color"
	"image/png"
	"math"
)

var (
	bgColor     = color.NRGBA{R: 0x08, G: 0x0c, B: 0x16, A: 0xff}
	plateBorder = color.NRGBA{R: 0x31, G: 0x2e, B: 0x81, A: 0xff}
	topColor1   = color.NRGBA{R: 0xa5, G: 0xb4, B: 0xfc, A: 0xff} // Indigo 300
	topColor2   = color.NRGBA{R: 0x4f, G: 0x46, B: 0xe5, A: 0xff} // Indigo 600
	leftColor1  = color.NRGBA{R: 0x43, G: 0x38, B: 0xca, A: 0xff} // Indigo 700
	leftColor2  = color.NRGBA{R: 0x1e, G: 0x1b, B: 0x4b, A: 0xff} // Indigo 950
	rightColor1 = color.NRGBA{R: 0x37, G: 0x30, B: 0xa3, A: 0xff} // Indigo 800
	rightColor2 = color.NRGBA{R: 0x0f, G: 0x17, B: 0x2a, A: 0xff} // Slate 900
	cyanAccent  = color.NRGBA{R: 0x38, G: 0xbd, B: 0xf8, A: 0xff} // Sky 400
	whitePrompt = color.NRGBA{R: 0xf8, G: 0xfa, B: 0xfc, A: 0xff} // White
	glowColor   = color.NRGBA{R: 0x63, G: 0x66, B: 0xf1, A: 0x40} // Indigo Glow
)

type pt struct{ x, y float64 }

func isInsidePoly(p pt, poly []pt) bool {
	inside := false
	n := len(poly)
	for i, j := 0, n-1; i < n; j, i = i, i+1 {
		if ((poly[i].y > p.y) != (poly[j].y > p.y)) &&
			(p.x < (poly[j].x-poly[i].x)*(p.y-poly[i].y)/(poly[j].y-poly[i].y)+poly[i].x) {
			inside = !inside
		}
	}
	return inside
}

func distToSegment(p, a, b pt) float64 {
	dx := b.x - a.x
	dy := b.y - a.y
	l2 := dx*dx + dy*dy
	if l2 == 0 {
		return math.Hypot(p.x-a.x, p.y-a.y)
	}
	t := ((p.x-a.x)*dx + (p.y-a.y)*dy) / l2
	if t < 0 {
		t = 0
	} else if t > 1 {
		t = 1
	}
	return math.Hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy))
}

func Draw(size int) *image.NRGBA {
	if size < 16 {
		size = 16
	}
	img := image.NewNRGBA(image.Rect(0, 0, size, size))
	s := float64(size)
	c := s / 2.0

	// 1. Draw rounded squircle plate
	cornerR := s * 0.22
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			px, py := float64(x)+0.5, float64(y)+0.5
			// Distance from center to edge of squircle
			dx := math.Max(math.Abs(px-c)-(c-cornerR), 0)
			dy := math.Max(math.Abs(py-c)-(c-cornerR), 0)
			d := math.Hypot(dx, dy) - cornerR

			if d <= 0 {
				// Plate body with subtle radial gradient
				distFromCenter := math.Hypot(px-c, py-c) / c
				r := uint8(float64(bgColor.R) + 12*(1.0-distFromCenter))
				g := uint8(float64(bgColor.G) + 16*(1.0-distFromCenter))
				b := uint8(float64(bgColor.B) + 30*(1.0-distFromCenter))
				cov := math.Min(1.0, math.Max(0.0, -d+0.5))
				img.SetNRGBA(x, y, color.NRGBA{R: r, G: g, B: b, A: uint8(cov * 255)})
			} else if d <= 1.2 {
				cov := math.Max(0.0, 1.2-d) / 1.2
				img.SetNRGBA(x, y, color.NRGBA{R: plateBorder.R, G: plateBorder.G, B: plateBorder.B, A: uint8(cov * 220)})
			}
		}
	}

	// 2. Isometric Cube Vertices
	// Box dimensions relative to size
	boxW := s * 0.36
	boxH := s * 0.20
	depth := s * 0.32
	boxCenterY := c + s*0.02

	vTop := pt{c, boxCenterY - boxH - depth*0.5}
	vRight := pt{c + boxW, boxCenterY - depth*0.5}
	vCenter := pt{c, boxCenterY + boxH - depth*0.5}
	vLeft := pt{c - boxW, boxCenterY - depth*0.5}

	vBottom := pt{c, boxCenterY + boxH + depth*0.5}
	vBottomLeft := pt{c - boxW, boxCenterY + depth*0.5}
	vBottomRight := pt{c + boxW, boxCenterY + depth*0.5}

	polyTop := []pt{vTop, vRight, vCenter, vLeft}
	polyLeft := []pt{vLeft, vCenter, vBottom, vBottomLeft}
	polyRight := []pt{vCenter, vRight, vBottomRight, vBottom}

	// 3. Rasterize 3D Isometric Faces
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			p := pt{float64(x) + 0.5, float64(y) + 0.5}

			if isInsidePoly(p, polyTop) {
				t := (p.y - vTop.y) / (vCenter.y - vTop.y)
				if t < 0 {
					t = 0
				} else if t > 1 {
					t = 1
				}
				r := uint8(float64(topColor1.R)*(1-t) + float64(topColor2.R)*t)
				g := uint8(float64(topColor1.G)*(1-t) + float64(topColor2.G)*t)
				b := uint8(float64(topColor1.B)*(1-t) + float64(topColor2.B)*t)
				img.SetNRGBA(x, y, color.NRGBA{R: r, G: g, B: b, A: 255})
			} else if isInsidePoly(p, polyLeft) {
				t := (p.y - vLeft.y) / (vBottom.y - vLeft.y)
				if t < 0 {
					t = 0
				} else if t > 1 {
					t = 1
				}
				r := uint8(float64(leftColor1.R)*(1-t) + float64(leftColor2.R)*t)
				g := uint8(float64(leftColor1.G)*(1-t) + float64(leftColor2.G)*t)
				b := uint8(float64(leftColor1.B)*(1-t) + float64(leftColor2.B)*t)
				img.SetNRGBA(x, y, color.NRGBA{R: r, G: g, B: b, A: 255})
			} else if isInsidePoly(p, polyRight) {
				t := (p.y - vRight.y) / (vBottomRight.y - vRight.y)
				if t < 0 {
					t = 0
				} else if t > 1 {
					t = 1
				}
				r := uint8(float64(rightColor1.R)*(1-t) + float64(rightColor2.R)*t)
				g := uint8(float64(rightColor1.G)*(1-t) + float64(rightColor2.G)*t)
				b := uint8(float64(rightColor1.B)*(1-t) + float64(rightColor2.B)*t)
				img.SetNRGBA(x, y, color.NRGBA{R: r, G: g, B: b, A: 255})
			}
		}
	}

	// 4. Draw Shell Edge Highlights
	edges := [][]pt{
		{vTop, vRight}, {vRight, vCenter}, {vCenter, vLeft}, {vLeft, vTop},
		{vLeft, vBottomLeft}, {vCenter, vBottom}, {vRight, vBottomRight},
		{vBottomLeft, vBottom}, {vBottom, vBottomRight},
	}
	edgeThick := math.Max(0.8, s*0.02)
	for _, edge := range edges {
		drawAntiAliasedLine(img, edge[0], edge[1], edgeThick, color.NRGBA{R: 0xc7, G: 0xd2, B: 0xfe, A: 0xee})
	}

	// 5. Draw Shelf Layers on Left Face
	shelf1A := pt{vLeft.x, vLeft.y + depth*0.35}
	shelf1B := pt{vCenter.x, vCenter.y + depth*0.35}
	shelf2A := pt{vLeft.x, vLeft.y + depth*0.70}
	shelf2B := pt{vCenter.x, vCenter.y + depth*0.70}
	drawAntiAliasedLine(img, shelf1A, shelf1B, edgeThick*0.8, color.NRGBA{R: 0x81, G: 0x8c, B: 0xf8, A: 0xaa})
	drawAntiAliasedLine(img, shelf2A, shelf2B, edgeThick*0.8, color.NRGBA{R: 0x81, G: 0x8c, B: 0xf8, A: 0xaa})

	// 6. Draw Glowing Terminal Prompt on Top Face (> _)
	promptSize := s * 0.10
	arrowTop := pt{c - promptSize*0.9, vCenter.y - boxH*0.9}
	arrowMid := pt{c - promptSize*0.2, vCenter.y - boxH*0.5}
	arrowBot := pt{c - promptSize*0.9, vCenter.y - boxH*0.1}

	promptThick := math.Max(1.2, s*0.04)
	drawAntiAliasedLine(img, arrowTop, arrowMid, promptThick, whitePrompt)
	drawAntiAliasedLine(img, arrowMid, arrowBot, promptThick, whitePrompt)

	lineStart := pt{c + promptSize*0.2, vCenter.y - boxH*0.1}
	lineEnd := pt{c + promptSize*1.1, vCenter.y - boxH*0.1}
	drawAntiAliasedLine(img, lineStart, lineEnd, promptThick*1.1, cyanAccent)

	return img
}

func drawAntiAliasedLine(img *image.NRGBA, a, b pt, thickness float64, col color.NRGBA) {
	bounds := img.Bounds()
	minX := int(math.Max(0, math.Floor(math.Min(a.x, b.x)-thickness-1)))
	maxX := int(math.Min(float64(bounds.Max.X), math.Ceil(math.Max(a.x, b.x)+thickness+1)))
	minY := int(math.Max(0, math.Floor(math.Min(a.y, b.y)-thickness-1)))
	maxY := int(math.Min(float64(bounds.Max.Y), math.Ceil(math.Max(a.y, b.y)+thickness+1)))

	halfThick := thickness / 2.0
	for y := minY; y < maxY; y++ {
		for x := minX; x < maxX; x++ {
			p := pt{float64(x) + 0.5, float64(y) + 0.5}
			d := distToSegment(p, a, b)
			if d <= halfThick+1.0 {
				alpha := math.Max(0.0, math.Min(1.0, halfThick+1.0-d))
				blend(img, x, y, col, alpha)
			}
		}
	}
}

func blend(img *image.NRGBA, x, y int, src color.NRGBA, alpha float64) {
	dst := img.NRGBAAt(x, y)
	sa := (float64(src.A) / 255.0) * alpha
	if sa <= 0 {
		return
	}
	da := float64(dst.A) / 255.0
	outA := sa + da*(1.0-sa)
	if outA <= 0 {
		return
	}
	r := uint8((float64(src.R)*sa + float64(dst.R)*da*(1.0-sa)) / outA)
	g := uint8((float64(src.G)*sa + float64(dst.G)*da*(1.0-sa)) / outA)
	b := uint8((float64(src.B)*sa + float64(dst.B)*da*(1.0-sa)) / outA)
	img.SetNRGBA(x, y, color.NRGBA{R: r, G: g, B: b, A: uint8(outA * 255.0)})
}

func EncodePNG(size int) ([]byte, error) {
	var buf bytes.Buffer
	if err := png.Encode(&buf, Draw(size)); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func EncodeICO(sizes ...int) ([]byte, error) {
	if len(sizes) == 0 {
		sizes = []int{16, 24, 32, 48, 64, 128, 256}
	}
	type entry struct {
		size int
		png  []byte
	}
	entries := make([]entry, 0, len(sizes))
	for _, s := range sizes {
		b, err := EncodePNG(s)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry{size: s, png: b})
	}
	var buf bytes.Buffer
	_ = binary.Write(&buf, binary.LittleEndian, uint16(0))
	_ = binary.Write(&buf, binary.LittleEndian, uint16(1))
	_ = binary.Write(&buf, binary.LittleEndian, uint16(len(entries)))
	offset := 6 + 16*len(entries)
	for _, e := range entries {
		w, h := byte(e.size), byte(e.size)
		if e.size >= 256 {
			w, h = 0, 0
		}
		buf.WriteByte(w)
		buf.WriteByte(h)
		buf.WriteByte(0)
		buf.WriteByte(0)
		_ = binary.Write(&buf, binary.LittleEndian, uint16(1))
		_ = binary.Write(&buf, binary.LittleEndian, uint16(32))
		_ = binary.Write(&buf, binary.LittleEndian, uint32(len(e.png)))
		_ = binary.Write(&buf, binary.LittleEndian, uint32(offset))
		offset += len(e.png)
	}
	for _, e := range entries {
		buf.Write(e.png)
	}
	return buf.Bytes(), nil
}
