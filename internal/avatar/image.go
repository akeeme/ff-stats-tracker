// Package avatar turns an uploaded photo into a square 512px JPEG and stores it in S3 (MinIO).
package avatar

import (
	"bytes"
	"encoding/binary"
	"errors"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"net/http"

	xdraw "golang.org/x/image/draw"
	"golang.org/x/image/webp"
)

const (
	MaxUploadBytes = 5 << 20
	Size           = 512
	maxPixels      = 50_000_000 // ~ 8660x5770; stops decompression bombs before decode
)

var ErrUnsupported = errors.New("only JPEG, PNG or WebP images are allowed")

// shortcut: output is JPEG, not WebP. Go has no pure-Go lossy WebP encoder; JPEG q85 at 512px is ~40-80 KB.
// Upgrade if a cgo/libwebp build is ever acceptable.

// Process sniffs the real type from the bytes (never the filename), decodes, applies EXIF
// orientation, center-crops to a square and encodes a Size x Size JPEG.
func Process(data []byte) ([]byte, error) {
	if len(data) > MaxUploadBytes {
		return nil, errors.New("image is larger than 5 MB")
	}
	src, err := decode(data)
	if err != nil {
		return nil, err
	}

	b := src.Bounds()
	side := min(b.Dx(), b.Dy())
	crop := image.Rect(0, 0, side, side).Add(image.Pt(b.Min.X+(b.Dx()-side)/2, b.Min.Y+(b.Dy()-side)/2))
	dst := image.NewRGBA(image.Rect(0, 0, Size, Size))
	draw.Draw(dst, dst.Bounds(), image.NewUniform(color.RGBA{0x14, 0x17, 0x1c, 0xff}), image.Point{}, draw.Src) // transparent PNGs land on the app's dark bg
	xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, crop, xdraw.Over, nil)

	out := orient(dst, jpegOrientation(data))
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, out, &jpeg.Options{Quality: 85}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// decode sniffs the type from the bytes, rejects decompression bombs, then decodes.
func decode(data []byte) (image.Image, error) {
	var decode func([]byte) (image.Image, error)
	var config func([]byte) (image.Config, error)
	switch http.DetectContentType(data) {
	case "image/jpeg":
		decode = func(b []byte) (image.Image, error) { return jpeg.Decode(bytes.NewReader(b)) }
		config = func(b []byte) (image.Config, error) { return jpeg.DecodeConfig(bytes.NewReader(b)) }
	case "image/png":
		decode = func(b []byte) (image.Image, error) { return png.Decode(bytes.NewReader(b)) }
		config = func(b []byte) (image.Config, error) { return png.DecodeConfig(bytes.NewReader(b)) }
	case "image/webp":
		decode = func(b []byte) (image.Image, error) { return webp.Decode(bytes.NewReader(b)) }
		config = func(b []byte) (image.Config, error) { return webp.DecodeConfig(bytes.NewReader(b)) }
	default:
		return nil, ErrUnsupported
	}
	cfg, err := config(data)
	if err != nil || cfg.Width < 1 || cfg.Height < 1 {
		return nil, errors.New("could not read image")
	}
	if cfg.Width*cfg.Height > maxPixels {
		return nil, errors.New("image dimensions are too large")
	}
	src, err := decode(data)
	if err != nil {
		return nil, errors.New("could not read image")
	}
	return src, nil
}

const (
	IconMaxBytes = 500 << 10
	IconSize     = 128
)

// ProcessIcon makes a custom reaction: fit inside IconSize x IconSize (no crop), centered on a
// transparent square, PNG.
func ProcessIcon(data []byte) ([]byte, error) {
	if len(data) > IconMaxBytes {
		return nil, errors.New("image is larger than 500 KB")
	}
	src, err := decode(data)
	if err != nil {
		return nil, err
	}
	b := src.Bounds()
	w, h := IconSize, IconSize
	if b.Dx() > b.Dy() {
		h = max(1, IconSize*b.Dy()/b.Dx())
	} else {
		w = max(1, IconSize*b.Dx()/b.Dy())
	}
	dst := image.NewNRGBA(image.Rect(0, 0, IconSize, IconSize)) // zero value = fully transparent
	at := image.Rect(0, 0, w, h).Add(image.Pt((IconSize-w)/2, (IconSize-h)/2))
	xdraw.CatmullRom.Scale(dst, at, src, b, xdraw.Over, nil)
	var buf bytes.Buffer
	if err := (&png.Encoder{CompressionLevel: png.BestCompression}).Encode(&buf, dst); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// orient applies EXIF orientation 2..8 to a square image (dst(x,y) = src(f(x,y))).
func orient(src *image.RGBA, o int) *image.RGBA {
	if o < 2 || o > 8 {
		return src
	}
	n := src.Bounds().Dx()
	dst := image.NewRGBA(src.Bounds())
	for y := 0; y < n; y++ {
		for x := 0; x < n; x++ {
			sx, sy := x, y
			switch o {
			case 2:
				sx = n - 1 - x
			case 3:
				sx, sy = n-1-x, n-1-y
			case 4:
				sy = n - 1 - y
			case 5:
				sx, sy = y, x
			case 6:
				sx, sy = y, n-1-x
			case 7:
				sx, sy = n-1-y, n-1-x
			case 8:
				sx, sy = n-1-y, x
			}
			dst.SetRGBA(x, y, src.RGBAAt(sx, sy))
		}
	}
	return dst
}

// jpegOrientation reads the EXIF Orientation tag (0x0112) from IFD0; 1 when absent or malformed.
func jpegOrientation(d []byte) int {
	for i := 2; i+4 <= len(d) && d[i] == 0xFF; {
		marker, segLen := d[i+1], int(binary.BigEndian.Uint16(d[i+2:]))
		if marker == 0xDA || segLen < 2 || i+2+segLen > len(d) {
			break
		}
		seg := d[i+4 : i+2+segLen]
		if marker == 0xE1 && len(seg) >= 14 && string(seg[:6]) == "Exif\x00\x00" {
			t := seg[6:]
			var bo binary.ByteOrder = binary.BigEndian
			if string(t[:2]) == "II" {
				bo = binary.LittleEndian
			}
			ifd := int(bo.Uint32(t[4:]))
			if ifd+2 > len(t) {
				return 1
			}
			for e, n := ifd+2, int(bo.Uint16(t[ifd:])); n > 0 && e+12 <= len(t); e, n = e+12, n-1 {
				if bo.Uint16(t[e:]) == 0x0112 {
					return int(bo.Uint16(t[e+8:]))
				}
			}
			return 1
		}
		i += 2 + segLen
	}
	return 1
}
