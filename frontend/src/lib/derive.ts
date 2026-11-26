// Pure derivations for the option-A UI. Everything is computed from games + stat rows; nothing here
// trusts the stored team W/L unless the team row is flagged record_manual (the manual override).
import type { Game, Player, PlayerStats, Team } from './api'

export const TEAM = 'Rhinos'

export type Person = {
  id: number
  name: string
  nickname?: string | null
  bio?: string | null
  avatar_url?: string | null
  seasons: { season: number; playerId: number; jersey?: string | null }[]
}
export type PersonExtra = { id: number; nickname?: string | null; bio?: string | null; avatar_url?: string | null }

export const STAT_KEYS = ['passing_tds', 'passes_completed', 'passes_attempted', 'interceptions_thrown', 'receptions', 'targets',
  'receiving_tds', 'drops', 'first_downs', 'rushing_tds', 'rush_attempts', 'flag_pulls', 'sacks', 'interceptions',
  'pass_breakups', 'def_td', 'safeties'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export type Line = Record<StatKey, number> & { gp: number }

export const emptyLine = (): Line => Object.fromEntries([...STAT_KEYS.map(k => [k, 0]), ['gp', 0]]) as Line
export const addLine = (a: Line, s: Partial<Record<StatKey, number>>): Line => {
  for (const k of STAT_KEYS) a[k] += s[k] || 0
  a.gp++
  return a
}
export const totalTD = (s: Partial<Record<StatKey, number>>) =>
  (s.passing_tds || 0) + (s.receiving_tds || 0) + (s.rushing_tds || 0) + (s.def_td || 0)

export type Side = { us: number; them: number; opp: string; res: 'W' | 'L' | 'T'; isHome: boolean }
export function side(g: Game): Side {
  const isHome = g.team1_name === TEAM
  const us = isHome ? g.team1_score : g.team2_score
  const them = isHome ? g.team2_score : g.team1_score
  return { us, them, opp: isHome ? g.team2_name : g.team1_name, res: us > them ? 'W' : us < them ? 'L' : 'T', isHome }
}

export const gameLabel = (g: Game) =>
  g.game_type === 'championship' ? 'Championship' : g.game_type === 'playoff' ? 'Playoff' : `Week ${g.week}`

export const byRecent = (a: Game, b: Game) => b.season - a.season || b.week - a.week

export const seasonsOf = (games: Game[]) => [...new Set(games.map(g => g.season))].sort((a, b) => b - a)

export type Record3 = { w: number; l: number; t: number; pf: number; pa: number }
export function record(games: Game[], opts: { season?: number; regularOnly?: boolean } = {}): Record3 {
  const r = { w: 0, l: 0, t: 0, pf: 0, pa: 0 }
  for (const g of games) {
    if (opts.season !== undefined && g.season !== opts.season) continue
    if (opts.regularOnly && g.game_type !== 'regular') continue
    const s = side(g)
    r[s.res === 'W' ? 'w' : s.res === 'L' ? 'l' : 't']++
    r.pf += s.us
    r.pa += s.them
  }
  return r
}
export const fmtRecord = (r: { w: number; l: number; t: number }) => `${r.w}-${r.l}${r.t ? `-${r.t}` : ''}`

// League table for one season. Only games involving the Rhinos are recorded, so other teams' computed
// records are partial; a team row with record_manual=true shows its stored W/L instead.
export type StandingRow = { name: string; w: number; l: number; t: number; pf: number; pa: number; manual: boolean }
export function standings(games: Game[], teams: (Team & { record_manual?: boolean })[], season: number): StandingRow[] {
  const rows = new Map<string, StandingRow>()
  const row = (name: string) => rows.get(name) ?? rows.set(name, { name, w: 0, l: 0, t: 0, pf: 0, pa: 0, manual: false }).get(name)!
  for (const g of games.filter(x => x.season === season && x.game_type === 'regular')) {
    for (const [n, a, b] of [[g.team1_name, g.team1_score, g.team2_score], [g.team2_name, g.team2_score, g.team1_score]] as const) {
      const r = row(n)
      r[a > b ? 'w' : a < b ? 'l' : 't']++
      r.pf += a
      r.pa += b
    }
  }
  for (const t of teams.filter(x => x.season === season && !x.is_deleted)) {
    const r = row(t.name)
    if (t.record_manual) Object.assign(r, { w: t.wins, l: t.losses, t: t.ties, manual: true })
  }
  const pct = (r: StandingRow) => (r.w + r.t / 2) / Math.max(1, r.w + r.l + r.t)
  return [...rows.values()].sort((a, b) => pct(b) - pct(a) || b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa))
}

// One person per human: canonical_player_id groups the per-season player rows.
export function buildPeople(players: Player[], extras: PersonExtra[] = []): Map<number, Person> {
  const ex = new Map(extras.map(e => [e.id, e]))
  const out = new Map<number, Person>()
  for (const p of [...players].filter(p => !p.is_deleted).sort((a, b) => a.season - b.season || a.id - b.id)) {
    const id = p.canonical_player_id ?? p.id
    const person = out.get(id) ?? out.set(id, { id, name: p.name.trim(), ...ex.get(id), seasons: [] }).get(id)!
    person.seasons.push({ season: p.season, playerId: p.id, jersey: p.jersey_number })
  }
  return out
}

export type Row = PlayerStats & { personId: number }
export function withPerson(stats: PlayerStats[], players: Player[]): Row[] {
  const toPerson = new Map(players.map(p => [p.id, p.canonical_player_id ?? p.id]))
  return stats.filter(s => !s.is_deleted).map(s => ({ ...s, personId: toPerson.get(s.player_id) ?? s.player_id }))
}

export const statsForGame = (rows: Row[], gameId: number) => rows.filter(r => r.game_id === gameId)

// Same weights as the existing Player of the Game cards (dashboard.tsx), so numbers stay familiar.
export function offenseScore(s: PlayerStats) {
  return s.passing_tds * 6 + s.receiving_tds * 10 + s.rushing_tds * 10 + s.receptions * 2.5 + s.passes_completed * 0.5 +
    s.first_downs * 2 - s.interceptions_thrown * 7 - s.drops * 3 - (s.passes_attempted - s.passes_completed) * 0.5
}
export function defenseScore(s: PlayerStats) {
  return s.interceptions * 8 + s.def_td * 10 + s.safeties * 10 + s.pass_breakups * 4 + s.sacks * 5 + s.flag_pulls * 2
}
export const impact = (s: PlayerStats) => Math.max(0, offenseScore(s)) + defenseScore(s)

export function topPerformances(rows: Row[], n = 5) {
  return [...rows].sort((a, b) => impact(b) - impact(a)).filter(r => impact(r) > 0).slice(0, n)
}

/** Short human stat line, offense first, then defense. */
export function statLine(s: Partial<Record<StatKey, number>>): [string, string] {
  const off: string[] = []
  if (s.passes_attempted) off.push(`${s.passes_completed}/${s.passes_attempted}, ${s.passing_tds} pass TD`)
  if (s.receptions || s.targets) off.push(`${s.receptions} rec, ${s.receiving_tds} TD`)
  if (s.rushing_tds) off.push(`${s.rushing_tds} rush TD`)
  const def = [s.interceptions && `${s.interceptions} INT`, s.pass_breakups && `${s.pass_breakups} PBU`,
    s.flag_pulls && `${s.flag_pulls} pulls`, s.sacks && `${s.sacks} sack`, s.def_td && `${s.def_td} def TD`].filter(Boolean) as string[]
  return [off.join(' · ') || (def.length ? 'Defense' : '—'), def.join(' · ')]
}

export function lineFor(rows: Row[], personId: number, season?: number, games?: Map<number, Game>): Line {
  return rows.filter(r => r.personId === personId && (season === undefined || games?.get(r.game_id)?.season === season))
    .reduce(addLine, emptyLine())
}

export const LEADER_CATS: { key: StatKey | 'total_td'; label: string }[] = [
  { key: 'passing_tds', label: 'Passing TD' }, { key: 'receiving_tds', label: 'Receiving TD' },
  { key: 'receptions', label: 'Receptions' }, { key: 'rushing_tds', label: 'Rushing TD' },
  { key: 'interceptions', label: 'Interceptions' }, { key: 'flag_pulls', label: 'Flag pulls' },
  { key: 'pass_breakups', label: 'Pass breakups' }, { key: 'total_td', label: 'Total TD' },
]

export function leaders(rows: Row[], key: StatKey | 'total_td', season?: number, games?: Map<number, Game>, n = 5) {
  const lines = new Map<number, Line>()
  for (const r of rows) {
    if (season !== undefined && games?.get(r.game_id)?.season !== season) continue
    addLine(lines.get(r.personId) ?? lines.set(r.personId, emptyLine()).get(r.personId)!, r)
  }
  const val = (l: Line) => (key === 'total_td' ? totalTD(l) : l[key])
  return [...lines].map(([personId, l]) => ({ personId, value: val(l), line: l }))
    .filter(x => x.value > 0).sort((a, b) => b.value - a.value || a.line.gp - b.line.gp).slice(0, n)
}

/** Rank of `personId` on `key` across all people's career totals (1 = best). */
export function careerRank(rows: Row[], personId: number, key: StatKey): number {
  const tot = new Map<number, number>()
  for (const r of rows) tot.set(r.personId, (tot.get(r.personId) || 0) + r[key])
  const mine = tot.get(personId) || 0
  return 1 + [...tot.values()].filter(v => v > mine).length
}

export const initials = (name: string) => name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() ||
  name.slice(0, 2).toUpperCase()

export const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '—')
