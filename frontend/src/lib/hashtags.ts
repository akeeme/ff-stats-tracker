// Auto hashtags for a stat line. THIS FILE IS THE CONFIG: rename a tag by editing `tag`, retune a
// threshold by editing `when`, reorder by editing `priority` (higher shows first). Max 5 tags per line.
// A game with no stat row gets no tags; an all-zero line matches nothing.
import type { StatKey } from './derive'

type S = Record<StatKey, number>
export type Rule = { tag: string; priority: number; rule: string; when: (s: S) => boolean }

const att = (s: S) => s.passes_attempted
const ownTD = (s: S) => s.receiving_tds + s.rushing_tds + s.def_td // TDs this player scored (not thrown)

export const RULES: Rule[] = [
  { tag: '10burger',      priority: 100, rule: '10+ pass TD',                               when: s => s.passing_tds >= 10 },
  { tag: 'pickparty',     priority: 95,  rule: '2+ INT on defense',                         when: s => s.interceptions >= 2 },
  { tag: 'housecall',     priority: 92,  rule: 'Defensive TD',                              when: s => s.def_td >= 1 },
  { tag: 'safetydance',   priority: 90,  rule: '1+ safety',                                 when: s => s.safeties >= 1 },
  { tag: 'dualthreat',    priority: 88,  rule: 'Pass TD and rush TD in the same game',      when: s => s.passing_tds >= 1 && s.rushing_tds >= 1 },
  { tag: 'moneyhands',    priority: 85,  rule: '3+ receiving TD',                           when: s => s.receiving_tds >= 3 },
  { tag: 'redzonechef',   priority: 84,  rule: '4+ TD scored (rec + rush + def)',           when: s => ownTD(s) >= 4 },
  { tag: 'airraid',       priority: 80,  rule: '5-9 pass TD',                               when: s => s.passing_tds >= 5 && s.passing_tds < 10 },
  { tag: 'flawless',      priority: 78,  rule: '0 INT thrown on 10+ attempts',              when: s => att(s) >= 10 && s.interceptions_thrown === 0 },
  { tag: 'laserpointer',  priority: 75,  rule: '80%+ completions on 10+ attempts',          when: s => att(s) >= 10 && s.passes_completed / att(s) >= 0.8 },
  { tag: 'pulledpork',    priority: 74,  rule: '5+ flag pulls',                             when: s => s.flag_pulls >= 5 },
  { tag: 'flagsnatcher',  priority: 72,  rule: '3-4 flag pulls',                            when: s => s.flag_pulls >= 3 && s.flag_pulls < 5 },
  { tag: 'handsteam',     priority: 70,  rule: '4+ catches and 0 drops',                    when: s => s.receptions >= 4 && s.drops === 0 },
  { tag: 'swatteam',      priority: 66,  rule: '2+ pass breakups',                          when: s => s.pass_breakups >= 2 },
  { tag: 'qbhunter',      priority: 64,  rule: '1+ sack',                                   when: s => s.sacks >= 1 },
  { tag: 'twowaytraffic', priority: 62,  rule: 'Offensive TD and a defensive INT/TD',       when: s => s.passing_tds + s.receiving_tds + s.rushing_tds >= 1 && s.interceptions + s.def_td >= 1 },
  { tag: 'jetpack',       priority: 56,  rule: '2+ rushing TD',                             when: s => s.rushing_tds >= 2 },
  { tag: 'chainmover',    priority: 54,  rule: '3+ first downs',                            when: s => s.first_downs >= 3 },
  { tag: 'targetpractice',priority: 50,  rule: '8+ targets',                                when: s => s.targets >= 8 },
  { tag: 'slinginit',     priority: 45,  rule: '30+ pass attempts',                         when: s => att(s) >= 30 },
  { tag: 'scoreboard',    priority: 40,  rule: 'Exactly 1 TD scored (rec + rush + def)',    when: s => ownTD(s) === 1 },
  // friendly ribbing, lowest priority so they only show on quiet lines. Delete them if they land wrong.
  { tag: 'butterfingers', priority: 20,  rule: '3+ drops',                                  when: s => s.drops >= 3 },
  { tag: 'generousqb',    priority: 15,  rule: '3+ INT thrown',                             when: s => s.interceptions_thrown >= 3 },
]

export const MAX_TAGS = 5

const full = (s: Partial<S>) => new Proxy(s, { get: (o, k) => (o as Record<string | symbol, number>)[k] || 0 }) as S
const ranked = [...RULES].sort((a, b) => b.priority - a.priority)

/** Tags for one game's stat line: matching rules by priority, capped at MAX_TAGS. */
export function hashtags(s: Partial<S> | undefined): string[] {
  if (!s) return []
  const line = full(s)
  return ranked.filter(r => r.when(line)).slice(0, MAX_TAGS).map(r => r.tag)
}

/** Profile tags: the tags this player earned most often across games (ties go to priority). */
export function profileHashtags(lines: Partial<S>[]): { tag: string; n: number }[] {
  const n = new Map<string, number>()
  for (const l of lines) for (const t of hashtags(l)) n.set(t, (n.get(t) || 0) + 1)
  return ranked.filter(r => n.has(r.tag)).map(r => ({ tag: r.tag, n: n.get(r.tag)! }))
    .sort((a, b) => b.n - a.n).slice(0, MAX_TAGS) // stable sort keeps priority order on ties
}
