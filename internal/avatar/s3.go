package avatar

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Store writes to one bucket with a key that may only Put/Delete there (never MinIO root).
// Minimal SigV4 client: two calls don't justify an SDK dependency.
type Store struct {
	Endpoint, Bucket, Region, AccessKey, SecretKey string
	PublicBase                                     string // e.g. https://s3-api.keemlab.com/rhinos-avatars/
}

// FromEnv returns nil when storage isn't configured (the endpoint then answers 503).
func FromEnv() *Store {
	s := &Store{
		Endpoint:   strings.TrimRight(os.Getenv("S3_ENDPOINT"), "/"),
		Bucket:     os.Getenv("S3_BUCKET"),
		Region:     os.Getenv("S3_REGION"),
		AccessKey:  os.Getenv("S3_ACCESS_KEY"),
		SecretKey:  os.Getenv("S3_SECRET_KEY"),
		PublicBase: os.Getenv("AVATAR_URL_PREFIX"),
	}
	if s.Region == "" {
		s.Region = "us-east-1"
	}
	if s.Endpoint == "" || s.Bucket == "" || s.AccessKey == "" || s.SecretKey == "" || !strings.HasPrefix(s.PublicBase, "https://") || !strings.HasSuffix(s.PublicBase, "/") {
		return nil
	}
	return s
}

// NewKey is people/<id>/<128-bit random>.jpg, unguessable so the bucket needs no list permission.
func NewKey(personID int) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("people/%d/%s.jpg", personID, hex.EncodeToString(b)), nil
}

// NewIconKey is reactions/<code>-<128-bit random>.png. Same bucket as avatars so the existing
// scoped writer key (Put/Delete on rhinos-avatars/*) covers it; no new credential or policy.
func NewIconKey(code string) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("reactions/%s-%s.png", code, hex.EncodeToString(b)), nil
}

func (s *Store) URL(key string) string { return s.PublicBase + key }

// KeyFromURL returns the object key if url points into this bucket, else "".
func (s *Store) KeyFromURL(url string) string {
	if k, ok := strings.CutPrefix(url, s.PublicBase); ok && k != "" && !strings.Contains(k, "..") {
		return k
	}
	return ""
}

func (s *Store) Put(ctx context.Context, key string, body []byte) error {
	return s.do(ctx, http.MethodPut, key, body)
}

func (s *Store) Delete(ctx context.Context, key string) error {
	return s.do(ctx, http.MethodDelete, key, nil)
}

var client = &http.Client{Timeout: 20 * time.Second}

func (s *Store) do(ctx context.Context, method, key string, body []byte) error {
	req, err := http.NewRequestWithContext(ctx, method, s.Endpoint+"/"+s.Bucket+"/"+key, bytes.NewReader(body))
	if err != nil {
		return err
	}
	if method == http.MethodPut {
		ct := "image/jpeg"
		if strings.HasSuffix(key, ".png") {
			ct = "image/png"
		}
		req.Header.Set("Content-Type", ct)
		req.Header.Set("Cache-Control", "public, max-age=31536000, immutable") // keys are never reused
	}
	s.sign(req, body, time.Now().UTC())
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode/100 != 2 {
		msg, _ := io.ReadAll(io.LimitReader(res.Body, 300))
		return fmt.Errorf("s3 %s %s: %d %s", method, key, res.StatusCode, msg)
	}
	return nil
}

func (s *Store) sign(req *http.Request, body []byte, now time.Time) {
	amzDate := now.Format("20060102T150405Z")
	date := amzDate[:8]
	payload := sha256Hex(body)
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Content-Sha256", payload)
	const signed = "host;x-amz-content-sha256;x-amz-date"
	canonical := strings.Join([]string{req.Method, req.URL.EscapedPath(), req.URL.RawQuery,
		"host:" + req.URL.Host, "x-amz-content-sha256:" + payload, "x-amz-date:" + amzDate, "", signed, payload}, "\n")
	scope := date + "/" + s.Region + "/s3/aws4_request"
	toSign := "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n" + sha256Hex([]byte(canonical))
	sig := hex.EncodeToString(hmacSHA(signingKey(s.SecretKey, date, s.Region, "s3"), toSign))
	req.Header.Set("Authorization", "AWS4-HMAC-SHA256 Credential="+s.AccessKey+"/"+scope+", SignedHeaders="+signed+", Signature="+sig)
}

func signingKey(secret, date, region, service string) []byte {
	k := hmacSHA([]byte("AWS4"+secret), date)
	k = hmacSHA(k, region)
	k = hmacSHA(k, service)
	return hmacSHA(k, "aws4_request")
}

func hmacSHA(key []byte, msg string) []byte {
	m := hmac.New(sha256.New, key)
	m.Write([]byte(msg))
	return m.Sum(nil)
}

func sha256Hex(b []byte) string {
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}
