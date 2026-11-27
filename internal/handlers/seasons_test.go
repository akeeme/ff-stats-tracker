package handlers

import (
	"strings"
	"testing"
)

func TestCleanTeams(t *testing.T) {
	got, err := cleanTeams([]string{" Rhinos ", "HFB"})
	if err != nil || len(got) != 2 || got[0] != "Rhinos" {
		t.Fatalf("%v %v", got, err)
	}
	if got, err := cleanTeams(nil); err != nil || len(got) != 0 {
		t.Fatalf("empty list should be fine: %v %v", got, err)
	}
	for _, bad := range [][]string{{"HFB", "hfb"}, {"  "}, {strings.Repeat("x", 256)}} {
		if _, err := cleanTeams(bad); err == nil {
			t.Errorf("accepted %q", bad)
		}
	}
}

func TestRenameProblem(t *testing.T) {
	cases := []struct {
		from, to string
		ok       bool
	}{{"HFB", "Hot Fudge", true}, {"Rhinos", "Rhinos", true}, {"Rhinos", "Rhinoceros", false},
		{"HFB", "rhinos", false}, {"HFB", "", false}}
	for _, c := range cases {
		if got := renameProblem(c.from, c.to) == ""; got != c.ok {
			t.Errorf("%s -> %s: ok=%v", c.from, c.to, got)
		}
	}
}

func TestDeleteProblem(t *testing.T) {
	if deleteProblem("HFB", 0, 0) != "" {
		t.Error("empty team blocked")
	}
	if m := deleteProblem("HFB", 3, 0); !strings.Contains(m, "3 games") {
		t.Error(m)
	}
	if m := deleteProblem("Rhinos", 0, 1); !strings.Contains(m, "1 player on") {
		t.Error(m)
	}
}
