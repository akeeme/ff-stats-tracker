package avatar

import (
	"bytes"
	"encoding/hex"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

// left half red, right half blue
func halves(w, h int) *image.RGBA {
	m := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			c := color.RGBA{255, 0, 0, 255}
			if x >= w/2 {
				c = color.RGBA{0, 0, 255, 255}
			}
			m.SetRGBA(x, y, c)
		}
	}
	return m
}

func isRed(c color.Color) bool  { r, _, b, _ := c.RGBA(); return r > 0xc000 && b < 0x4000 }
func isBlue(c color.Color) bool { r, _, b, _ := c.RGBA(); return b > 0xc000 && r < 0x4000 }

// exifJPEG inserts a big-endian APP1 Exif segment with one Orientation entry after SOI.
func exifJPEG(t *testing.T, img image.Image, orientation byte) []byte {
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatal(err)
	}
	tiff := []byte{'M', 'M', 0, 42, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0, 0, 0}
	seg := append([]byte("Exif\x00\x00"), tiff...)
	app1 := append([]byte{0xFF, 0xE1, byte((len(seg) + 2) >> 8), byte(len(seg) + 2)}, seg...)
	j := buf.Bytes()
	return append(append(append([]byte{}, j[:2]...), app1...), j[2:]...)
}

func TestProcessPNGToSquareJPEG(t *testing.T) {
	var buf bytes.Buffer
	png.Encode(&buf, halves(900, 600))
	out, err := Process(buf.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	img, format, err := image.Decode(bytes.NewReader(out))
	if err != nil || format != "jpeg" || img.Bounds().Dx() != Size || img.Bounds().Dy() != Size {
		t.Fatalf("got %v %s %v", err, format, img.Bounds())
	}
	if !isRed(img.At(20, 256)) || !isBlue(img.At(490, 256)) {
		t.Fatal("center crop lost the red/blue split")
	}
}

func TestProcessAppliesEXIFOrientation(t *testing.T) {
	data := exifJPEG(t, halves(400, 400), 6) // 6 = rotate 90° CW to display: left (red) becomes top
	if got := jpegOrientation(data); got != 6 {
		t.Fatalf("orientation = %d", got)
	}
	out, err := Process(data)
	if err != nil {
		t.Fatal(err)
	}
	img, _ := jpeg.Decode(bytes.NewReader(out))
	if !isRed(img.At(256, 20)) || !isBlue(img.At(256, 490)) {
		t.Fatal("orientation 6 not applied")
	}
}

func TestProcessRejectsNonImages(t *testing.T) {
	for name, data := range map[string][]byte{
		"gif":       []byte("GIF89a\x01\x00\x01\x00\x00\x00\x00;"),
		"html":      []byte("<html><script>alert(1)</script></html>"),
		"fake-jpeg": append([]byte{0xFF, 0xD8, 0xFF}, bytes.Repeat([]byte{0}, 64)...), // jpeg magic, garbage body
		"too-big":   make([]byte, MaxUploadBytes+1),
	} {
		if _, err := Process(data); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}
}

// AWS SigV4 docs example signing key (secret/date/region/service from the published sample).
func TestSigningKey(t *testing.T) {
	k := signingKey("wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY", "20120215", "us-east-1", "iam")
	if got := hex.EncodeToString(k); got != "f4780e2d9f65fa895f9c67b32ce1baf0b0d8a43505a000a1a9e090d414db404d" {
		t.Fatal(got)
	}
}

func TestKeyFromURL(t *testing.T) {
	s := &Store{PublicBase: "https://s3.example/b/"}
	if s.KeyFromURL("https://s3.example/b/people/1/ab.jpg") != "people/1/ab.jpg" || s.KeyFromURL("https://evil/b/x") != "" || s.KeyFromURL("https://s3.example/b/../x") != "" {
		t.Fatal("KeyFromURL")
	}
}

func TestProcessIconPadsWideImageOnTransparentSquare(t *testing.T) {
	var in bytes.Buffer
	if err := png.Encode(&in, halves(400, 200)); err != nil {
		t.Fatal(err)
	}
	out, err := ProcessIcon(in.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	img, err := png.Decode(bytes.NewReader(out))
	if err != nil {
		t.Fatal(err)
	}
	if b := img.Bounds(); b.Dx() != IconSize || b.Dy() != IconSize {
		t.Fatalf("size %v", b)
	}
	if _, _, _, a := img.At(64, 5).RGBA(); a != 0 { // 400x200 -> 128x64 band in the middle; top is padding
		t.Fatalf("top padding not transparent: alpha %d", a)
	}
	if !isRed(img.At(10, 64)) || !isBlue(img.At(118, 64)) {
		t.Fatal("content not scaled into the middle band")
	}
	if len(out) > IconMaxBytes {
		t.Fatalf("output %d bytes", len(out))
	}
}

func TestProcessIconRejectsBigAndNonImage(t *testing.T) {
	if _, err := ProcessIcon(make([]byte, IconMaxBytes+1)); err == nil {
		t.Fatal("accepted > 500 KB")
	}
	if _, err := ProcessIcon([]byte("<svg xmlns='http://www.w3.org/2000/svg'/>")); err != ErrUnsupported {
		t.Fatalf("svg: %v", err)
	}
}
