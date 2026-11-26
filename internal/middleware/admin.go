package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Admin auth: the shared ADMIN_SECRET_KEY is exchanged once (POST /api/admin/session) for an
// httpOnly session cookie. Fails closed when the key is unset. Rotating the key revokes all sessions.

const (
	AdminCookie   = "rhinos_admin"
	sessionTTL    = 14 * 24 * time.Hour
	failWindow    = 15 * time.Minute
	perIPFailCap  = 5  // wrong guesses per IP per window
	globalFailCap = 30 // wrong guesses across all IPs per window (IP headers can be spoofed)
)

func adminSecret() string { return os.Getenv("ADMIN_SECRET_KEY") }

func sign(secret, exp string) string {
	m := hmac.New(sha256.New, []byte(secret))
	m.Write([]byte("rhinos-admin-session:" + exp))
	return hex.EncodeToString(m.Sum(nil))
}

// NewSessionValue returns "<unix-exp>.<hmac>".
func NewSessionValue(secret string, now time.Time) string {
	exp := strconv.FormatInt(now.Add(sessionTTL).Unix(), 10)
	return exp + "." + sign(secret, exp)
}

// ValidSession checks signature and expiry.
func ValidSession(secret, v string, now time.Time) bool {
	exp, mac, ok := strings.Cut(v, ".")
	if !ok || secret == "" {
		return false
	}
	n, err := strconv.ParseInt(exp, 10, 64)
	if err != nil || now.Unix() > n {
		return false
	}
	return hmac.Equal([]byte(mac), []byte(sign(secret, exp)))
}

// KeyMatches is a constant-time compare that is false when no key is configured.
func KeyMatches(secret, given string) bool {
	return secret != "" && given != "" && subtle.ConstantTimeCompare([]byte(secret), []byte(given)) == 1
}

// ClientIP prefers Cloudflare's header, then the first X-Forwarded-For hop (the Next proxy forwards it).
func ClientIP(c *fiber.Ctx) string {
	if ip := c.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	if xff := c.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	return c.IP()
}

// failure tracking for wrong admin keys
var fails = struct {
	sync.Mutex
	start  time.Time
	perIP  map[string]int
	global int
}{perIP: map[string]int{}}

func resetIfStale(now time.Time) {
	if now.Sub(fails.start) > failWindow {
		fails.start, fails.perIP, fails.global = now, map[string]int{}, 0
	}
}

// Locked reports whether this IP (or everyone) is over the wrong-guess cap.
func Locked(ip string, now time.Time) bool {
	fails.Lock()
	defer fails.Unlock()
	resetIfStale(now)
	return fails.perIP[ip] >= perIPFailCap || fails.global >= globalFailCap
}

func RecordFailure(ip string, now time.Time) {
	fails.Lock()
	defer fails.Unlock()
	resetIfStale(now)
	fails.perIP[ip]++
	fails.global++
}

// IsAdmin is true for a valid session cookie or a correct X-Admin-Key header (kept for scripts / rollback).
func IsAdmin(c *fiber.Ctx) bool {
	secret := adminSecret()
	if secret == "" {
		return false
	}
	if ValidSession(secret, c.Cookies(AdminCookie), time.Now()) {
		return true
	}
	return KeyMatches(secret, c.Get("X-Admin-Key"))
}

// AdminRequired guards write routes. Fails closed when ADMIN_SECRET_KEY is unset.
func AdminRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if adminSecret() == "" {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"success": false, "message": "Admin is not configured"})
		}
		ip, now := ClientIP(c), time.Now()
		if Locked(ip, now) {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"success": false, "message": "Too many attempts, try later"})
		}
		if IsAdmin(c) {
			return c.Next()
		}
		if c.Get("X-Admin-Key") != "" {
			RecordFailure(ip, now)
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"success": false, "message": "Admin access required"})
	}
}

func setCookie(c *fiber.Ctx, value string, maxAge int) {
	c.Cookie(&fiber.Cookie{
		Name: AdminCookie, Value: value, Path: "/api", MaxAge: maxAge,
		HTTPOnly: true, SameSite: "Strict", Secure: os.Getenv("COOKIE_INSECURE") != "1",
	})
}

// Login: POST /api/admin/session {"key": "..."}
func Login(c *fiber.Ctx) error {
	secret := adminSecret()
	if secret == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"success": false, "message": "Admin is not configured"})
	}
	ip, now := ClientIP(c), time.Now()
	if Locked(ip, now) {
		return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"success": false, "message": "Too many attempts, try later"})
	}
	var body struct {
		Key string `json:"key"`
	}
	if err := c.BodyParser(&body); err != nil || len(body.Key) > 256 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid request"})
	}
	if !KeyMatches(secret, body.Key) {
		RecordFailure(ip, now)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"success": false, "message": "Wrong key"})
	}
	setCookie(c, NewSessionValue(secret, now), int(sessionTTL.Seconds()))
	return c.JSON(fiber.Map{"success": true, "admin": true})
}

// Logout: DELETE /api/admin/session
func Logout(c *fiber.Ctx) error {
	setCookie(c, "", -1)
	return c.JSON(fiber.Map{"success": true, "admin": false})
}

// Session: GET /api/admin/session
func Session(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"admin": IsAdmin(c)})
}
