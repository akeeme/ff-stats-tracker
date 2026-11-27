package handlers

import "testing"

func TestParseTargets(t *testing.T) {
	types, ids, err := parseTargets("game:27,stat:101,person:25,")
	if err != nil || len(types) != 3 || types[1] != "stat" || ids[2] != 25 {
		t.Fatalf("%v %v %v", types, ids, err)
	}
	for _, bad := range []string{"feed:1", "game:0", "game:x", "game", "stat:-4", "game:1;drop"} {
		if _, _, err := parseTargets(bad); err == nil {
			t.Errorf("accepted %q", bad)
		}
	}
	many := ""
	for i := 0; i <= maxTargets; i++ {
		many += "game:1,"
	}
	if _, _, err := parseTargets(many); err == nil {
		t.Error("accepted > maxTargets")
	}
}

func TestValidEmoji(t *testing.T) {
	for _, ok := range []string{"🔥", "🦏", "👨‍👩‍👧", "🏳️‍🌈"} {
		if !validEmoji(ok) {
			t.Errorf("rejected %q", ok)
		}
	}
	for _, bad := range []string{"", "a", "<img>", "🔥 🔥", "🔥🔥🔥🔥🔥🔥🔥🔥🔥"} {
		if validEmoji(bad) {
			t.Errorf("accepted %q", bad)
		}
	}
}
