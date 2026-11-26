// Run: node --test src/lib/derive.test.ts   (Node >= 23 strips types natively)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPeople, careerRank, fmtRecord, leaders, record, side, standings, statsForGame, topPerformances, withPerson } from './derive.ts'

const g = (id: number, season: number, week: number, us: number, them: number, opp = 'HFB', type = 'regular', home = true) => ({
  id, season, week, game_type: type, league: 'Volo', is_deleted: false,
  team1_name: home ? 'Rhinos' : opp, team2_name: home ? opp : 'Rhinos',
  team1_score: home ? us : them, team2_score: home ? them : us,
}) as any
const zero = { passing_tds: 0, passes_completed: 0, passes_attempted: 0, interceptions_thrown: 0, receptions: 0, targets: 0, receiving_tds: 0, drops: 0, first_downs: 0, rushing_tds: 0, rush_attempts: 0, flag_pulls: 0, sacks: 0, interceptions: 0, pass_breakups: 0, def_td: 0, safeties: 0, is_deleted: false }
const st = (id: number, player_id: number, game_id: number, o: object) => ({ ...zero, id, player_id, game_id, ...o }) as any

const games = [g(1, 4, 1, 24, 13), g(2, 4, 2, 12, 61, 'WIS', 'regular', false), g(3, 4, 5, 84, 48, 'HFB', 'championship'), g(4, 3, 1, 30, 30, 'BS')]
const players = [
  { id: 25, name: 'Billy', season: 4, canonical_player_id: 25, is_deleted: false },
  { id: 35, name: 'Billy ', season: 3, canonical_player_id: 25, is_deleted: false },
  { id: 23, name: 'Akeeme', season: 4, canonical_player_id: 1, is_deleted: false },
] as any
const stats = [st(1, 25, 1, { passing_tds: 2, passes_completed: 7, passes_attempted: 22 }), st(2, 35, 3, { passing_tds: 10, passes_completed: 23, passes_attempted: 31 }),
  st(3, 23, 3, { receptions: 5, targets: 6, receiving_tds: 3 })]

test('side handles Rhinos as team2', () => {
  assert.deepEqual(side(games[1]), { us: 12, them: 61, opp: 'WIS', res: 'L', isHome: false })
})
test('record from scores, with regular-only + ties', () => {
  assert.equal(fmtRecord(record(games, { season: 4 })), '2-1')
  assert.equal(fmtRecord(record(games, { season: 4, regularOnly: true })), '1-1')
  assert.equal(fmtRecord(record(games, { season: 3 })), '0-0-1')
})
test('standings: computed, manual override wins', () => {
  const s = standings(games, [{ name: 'HFB', season: 4, wins: 9, losses: 0, ties: 0, record_manual: true, is_deleted: false }] as any, 4)
  assert.deepEqual(s.map(r => `${r.name}:${r.w}-${r.l}${r.manual ? '*' : ''}`), ['HFB:9-0*', 'WIS:1-0', 'Rhinos:1-1'])
})
test('people group per-season rows; stats from an old-season row still count for the person', () => {
  const people = buildPeople(players, [{ id: 25, nickname: 'Buckets' }])
  assert.equal(people.size, 2)
  assert.deepEqual(people.get(25)!.seasons.map(s => s.season), [3, 4])
  assert.equal(people.get(25)!.name, 'Billy')
  assert.equal(people.get(25)!.nickname, 'Buckets')
  const rows = withPerson(stats, players)
  assert.deepEqual(rows.map(r => r.personId), [25, 25, 1])
  assert.equal(leaders(rows, 'passing_tds')[0].value, 12)
  assert.equal(leaders(rows, 'passing_tds', 4, new Map(games.map(x => [x.id, x])))[0].value, 12)
  assert.equal(careerRank(rows, 1, 'receiving_tds'), 1)
})
test('game without stat rows yields no performances (no film)', () => {
  const rows = withPerson(stats, players)
  assert.equal(statsForGame(rows, 2).length, 0)
  assert.equal(topPerformances(statsForGame(rows, 3))[0].personId, 25)
})
