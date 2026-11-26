package middleware

import (
	"testing"
	"time"
)

func TestSession(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	v := NewSessionValue("s3cret", now)
	if !ValidSession("s3cret", v, now) {
		t.Fatal("fresh session should be valid")
	}
	if ValidSession("other", v, now) {
		t.Fatal("rotated key must revoke session")
	}
	if ValidSession("s3cret", v, now.Add(sessionTTL+time.Second)) {
		t.Fatal("expired session accepted")
	}
	if ValidSession("s3cret", v[:len(v)-1]+"0", now) || ValidSession("s3cret", "garbage", now) || ValidSession("", v, now) {
		t.Fatal("tampered/empty accepted")
	}
}

func TestKeyMatchesFailsClosed(t *testing.T) {
	if KeyMatches("", "") || KeyMatches("", "x") || KeyMatches("k", "") || KeyMatches("k", "K") || !KeyMatches("k", "k") {
		t.Fatal("KeyMatches wrong")
	}
}

func TestLockout(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	for i := 0; i < perIPFailCap; i++ {
		if Locked("1.1.1.1", now) {
			t.Fatalf("locked too early at %d", i)
		}
		RecordFailure("1.1.1.1", now)
	}
	if !Locked("1.1.1.1", now) || Locked("2.2.2.2", now) {
		t.Fatal("per-IP lock wrong")
	}
	if Locked("1.1.1.1", now.Add(failWindow+time.Second)) {
		t.Fatal("window should reset")
	}
}
