'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRhinos, type Rhinos } from '@/hooks/use-rhinos'
import { api, type Game } from '@/lib/api'
import { Avatar, ResultBadge, SeasonChips } from '@/components/rx'
import { AdminPage, SaveState, Stepper } from '@/components/admin-ui'
import { gameLabel, side, STAT_KEYS, type Row, type StatKey } from '@/lib/derive'

type Vals = Partial<Record<StatKey, number>>
const GROUPS: { id: string; label: string; stats: [StatKey, string][] }[] = [
  { id: 'pass', label: 'Passing', stats: [['passes_completed', 'Comp'], ['passes_attempted', 'Att'], ['passing_tds', 'TD'], ['interceptions_thrown', 'INT']] },
  { id: 'rec', label: 'Receiving', stats: [['receptions', 'Rec'], ['targets', 'Tgt'], ['receiving_tds', 'TD'], ['drops', 'Drop'], ['first_downs', '1st dn']] },
  { id: 'rush', label: 'Rushing', stats: [['rush_attempts', 'Att'], ['rushing_tds', 'TD']] },
  { id: 'def', label: 'Defense', stats: [['flag_pulls', 'Pulls'], ['sacks', 'Sack'], ['interceptions', 'INT'], ['pass_breakups', 'PBU'], ['def_td', 'Def TD'], ['safeties', 'Safety']] },
]

export default function StatsAdmin() {
  return <Suspense><StatsAdminInner /></Suspense>
}

function StatsAdminInner() {
  const params = useSearchParams()
  const gameId = Number(params.get('game')) || undefined
  const { data: d, error } = useRhinos()
  const game = gameId ? d?.gameById.get(gameId) : undefined
  return (
    <AdminPage title={game ? `Log · vs ${side(game).opp}` : 'Log stats'}>
      {!d ? <p className="rx-pad rx-muted">{error ? 'Couldn’t load games.' : 'Loading…'}</p>
        : game ? <GameLog key={game.id} d={d} game={game} /> : <GamePicker d={d} />}
    </AdminPage>
  )
}

function GamePicker({ d }: { d: Rhinos }) {
  const [pick, setPick] = useState<number>()
  const season = pick ?? d.seasons[0]
  const logged = (g: Game) => new Set(d.rows.filter(r => r.game_id === g.id).map(r => r.personId)).size
  return (
    <>
      <SeasonChips seasons={d.seasons} value={season} onChange={v => setPick(v as number)} />
      <div className="rx-sec">Pick a game<Link href="/admin/games">Add game ›</Link></div>
      <div className="rx-card">
        {d.games.filter(g => g.season === season).map(g => {
          const s = side(g), n = logged(g)
          return (
            <Link key={g.id} href={`/admin/stats?game=${g.id}`} className="rx-row">
              <span className={`rx-wl ${s.res}`}>{s.res}</span>
              <span className="rx-grow"><b>vs {s.opp}</b><small>{gameLabel(g)} · {s.us}-{s.them}</small></span>
              {n ? <span className="rx-muted" style={{ fontSize: 13 }}>{n} logged ›</span> : <span className="rx-nofilm">No stats yet</span>}
            </Link>
          )
        })}
      </div>
    </>
  )
}

function GameLog({ d, game }: { d: Rhinos; game: Game }) {
  const qc = useQueryClient()
  const router = useRouter()
  const s = side(game)
  const [group, setGroup] = useState('pass')
  const [edits, setEdits] = useState<Record<number, Vals>>({}) // playerId -> changed values
  const [state, setState] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; text?: string }>({ kind: 'idle' })
  useEffect(() => { if (matchMedia('(min-width: 900px)').matches) setGroup('all') }, [])

  // existing rows for this game keyed by the per-season player row they belong to
  const base = useMemo(() => new Map<number, Row>(d.rows.filter(r => r.game_id === game.id).map(r => [r.player_id, r])), [d.rows, game.id])
  // roster: everyone on this season's roster plus anyone who already has a row in this game
  const roster = useMemo(() => {
    const out: { playerId: number; personId: number; name: string }[] = []
    for (const p of d.people.values()) {
      const ids = new Set(p.seasons.filter(x => x.season === game.season).map(x => x.playerId))
      for (const r of base.values()) if (r.personId === p.id) ids.add(r.player_id)
      for (const playerId of ids) out.push({ playerId, personId: p.id, name: p.name })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [d.people, base, game.season])

  const val = (pid: number, k: StatKey) => edits[pid]?.[k] ?? base.get(pid)?.[k] ?? 0
  const dirtyIds = Object.keys(edits).map(Number)
  useEffect(() => {
    if (!dirtyIds.length) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    addEventListener('beforeunload', warn)
    return () => removeEventListener('beforeunload', warn)
  }, [dirtyIds.length])

  const change = (pid: number, k: StatKey, v: number) => {
    if (state.kind !== 'saving') setState({ kind: 'idle' })
    setEdits(prev => {
      const next = { ...prev, [pid]: { ...prev[pid], [k]: v } }
      if (v === (base.get(pid)?.[k] ?? 0)) delete next[pid][k]
      if (!Object.keys(next[pid]).length) delete next[pid]
      return next
    })
  }
  const n = dirtyIds.length
  const shown = state.kind !== 'idle' ? state : n ? { kind: 'dirty' as const, text: `${n} player${n > 1 ? 's' : ''} unsaved` } : { kind: 'clean' as const }

  const team = Object.fromEntries(STAT_KEYS.map(k => [k, 0])) as Record<StatKey, number>
  for (const r of roster) for (const k of STAT_KEYS) team[k] += val(r.playerId, k)
  const tdPts = 6 * (team.receiving_tds + team.rushing_tds + team.def_td) + 2 * team.safeties

  const save = async () => {
    setState({ kind: 'saving' })
    const failed: string[] = []
    const done: number[] = []
    for (const pid of dirtyIds) {
      const row = base.get(pid)
      const body = edits[pid]
      try {
        if (row) await api.saveStats(row.id, row.version, body)
        else await api.createStatsById({ player_id: pid, game_id: game.id, ...body })
        done.push(pid)
      } catch (e) {
        failed.push(`${roster.find(r => r.playerId === pid)?.name}: ${(e as Error).message}`)
      }
    }
    await qc.refetchQueries({ queryKey: ['stats'] })
    setEdits(prev => { const n = { ...prev }; for (const pid of done) delete n[pid]; return n })
    setState(failed.length ? { kind: 'error', text: `Not saved: ${failed.join('; ')}` } : { kind: 'saved' })
  }

  const groups = group === 'all' ? GROUPS : GROUPS.filter(g => g.id === group)
  return (
    <>
      <div className="rx-logtop">
        <div className="rx-logscore" aria-label={`Rhinos ${s.us}, ${s.opp} ${s.them}`}>
          <b>Rhinos</b><span className="rx-pts">{s.us}<span className="rx-dim"> – </span>{s.them}</span><b>{s.opp}</b>
          <span className="rx-muted">S{game.season} · {gameLabel(game)}</span><ResultBadge g={game} />
        </div>
        <div className="rx-totals" aria-label="Team totals">
          <span><b>{team.passes_completed}/{team.passes_attempted}</b> cmp</span>
          <span className={team.passing_tds !== team.receiving_tds ? 'warn' : ''} title="Pass TD should equal Rec TD"><b>{team.passing_tds}</b> pass TD · <b>{team.receiving_tds}</b> rec TD</span>
          <span><b>{team.rushing_tds}</b> rush TD</span>
          <span><b>{team.interceptions}</b> INT · <b>{team.flag_pulls}</b> pulls</span>
          <span className={tdPts > s.us ? 'warn' : ''}>TDs = <b>{tdPts}</b> of {s.us} pts{tdPts < s.us ? ` (+${s.us - tdPts} conv.)` : tdPts > s.us ? ' (too many)' : ''}</span>
        </div>
        <div className="rx-seg" role="tablist" aria-label="Stat group">
          {[...GROUPS, { id: 'all', label: 'All' }].map(g =>
            <button key={g.id} role="tab" aria-selected={group === g.id} onClick={() => setGroup(g.id)}>{g.label}</button>)}
        </div>
      </div>

      <div className="rx-loggrid">
        {roster.map(p => {
          const person = d.people.get(p.personId)
          const has = base.has(p.playerId)
          return (
            <section key={p.playerId} className={`rx-card rx-logcard${edits[p.playerId] ? ' dirty' : ''}`} aria-label={p.name}>
              <header><Avatar person={person} size={34} /><b>{p.name}</b>{!has && !edits[p.playerId] && <small className="rx-muted">no stats</small>}{edits[p.playerId] && <small className="rx-dot">unsaved</small>}</header>
              {groups.map(g => (
                <div key={g.id} className="rx-steps">
                  {group === 'all' && <div className="rx-steps-h">{g.label}</div>}
                  {g.stats.map(([k, label]) => (
                    <Stepper key={k} label={label} who={p.name} value={val(p.playerId, k)} onChange={v => change(p.playerId, k, v)}
                      changed={edits[p.playerId]?.[k] !== undefined}
                      warn={(k === 'passes_completed' && val(p.playerId, k) > val(p.playerId, 'passes_attempted')) || (k === 'receptions' && val(p.playerId, k) > val(p.playerId, 'targets'))} />
                  ))}
                </div>
              ))}
            </section>
          )
        })}
      </div>

      <div className="rx-savebar">
        <SaveState state={shown} />
        {dirtyIds.length > 0 && <button className="rx-btn ghost" onClick={() => { setEdits({}); setState({ kind: 'idle' }) }} disabled={state.kind === 'saving'}>Discard</button>}
        <button className="rx-btn" onClick={save} disabled={!dirtyIds.length || state.kind === 'saving'}>Save</button>
        {!dirtyIds.length && <button className="rx-btn ghost" onClick={() => router.push(`/games/${game.id}`)}>View box score</button>}
      </div>
    </>
  )
}
