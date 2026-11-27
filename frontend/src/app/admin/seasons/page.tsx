'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminPage } from '@/components/admin-ui'
import { fmtRecord, record, TEAM } from '@/lib/derive'

export default function SeasonsAdmin() {
  const qc = useQueryClient()
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.getTeams })
  const games = useQuery({ queryKey: ['games'], queryFn: api.getGames })
  const started = useQuery({ queryKey: ['seasons'], queryFn: api.getSeasons })
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>()
  const all = (teams.data ?? []).filter(t => !t.is_deleted)
  const live = (games.data ?? []).filter(g => !g.is_deleted)
  const rows = started.data ?? []
  const seasons = [...new Set([...all.map(t => t.season), ...live.map(g => g.season), ...rows.map(s => s.season)])].sort((a, b) => b - a)
  const leagueOf = (s: number) => rows.find(x => x.season === s)?.league ?? all.find(t => t.season === s && t.name === TEAM)?.league ?? all.find(t => t.season === s)?.league
  const end = useMutation({
    mutationFn: (s: number) => api.endSeason(s),
    onSuccess: (_, s) => { setMsg({ ok: true, text: `Season ${s} ended. Its teams are now inactive.` }); return qc.invalidateQueries({ queryKey: ['teams'] }) },
    onError: (e: Error) => setMsg({ ok: false, text: e.message }),
  })

  return (
    <AdminPage title="Seasons">
      {!teams.data || !started.data ? <p className="rx-pad rx-muted">{teams.error || started.error ? 'Couldn’t load seasons.' : 'Loading…'}</p> : <>
        <StartSeason latest={seasons[0] ?? 0} league={leagueOf(seasons[0]) ?? ''}
          prev={all.filter(t => t.season === seasons[0]).sort((a, b) => Number(b.name === TEAM) - Number(a.name === TEAM) || a.name.localeCompare(b.name))}
          onStarted={text => setMsg({ ok: true, text })} />
        {msg && <p className={msg.ok ? 'rx-pad rx-muted' : 'rx-pad rx-err'} role="status">{msg.text}</p>}
        <div className="rx-sec">All seasons</div>
        <div className="rx-card">
          {seasons.map(s => {
            const ts = all.filter(t => t.season === s)
            const active = ts.some(t => t.is_active)
            return (
              <div key={s} className="rx-row">
                <span className="rx-grow"><b>Season {s}</b><small>{ts.length ? `${ts.length} team${ts.length === 1 ? '' : 's'}` : 'No teams yet'} · {leagueOf(s) ?? '—'} · Rhinos {fmtRecord(record(live, { season: s }))}</small></span>
                {active
                  ? <button className="rx-btn ghost sm" disabled={end.isPending} onClick={() => confirm(`End Season ${s}? Its teams are marked inactive.`) && end.mutate(s)}>End season</button>
                  : <span className="rx-muted" style={{ fontSize: 13 }}>{ts.length ? 'Ended' : ''}</span>}
              </div>
            )
          })}
        </div>
      </>}
    </AdminPage>
  )
}

type T = { id: number; name: string; league: string }

/** Start-season form: league, which of last season's teams carry over (Rhinos only by default), new opponents. */
function StartSeason({ latest, league: lastLeague, prev, onStarted }: { latest: number; league: string; prev: T[]; onStarted: (t: string) => void }) {
  const qc = useQueryClient()
  const next = latest + 1
  const [league, setLeague] = useState<string>()
  const [picked, setPicked] = useState<Set<number>>()
  const [added, setAdded] = useState<string[]>([])
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const lg = league ?? lastLeague
  const carry = picked ?? new Set(prev.filter(t => t.name === TEAM).map(t => t.id))
  const names = [...prev.filter(t => carry.has(t.id)).map(t => t.name), ...added]

  const toggle = (id: number) => { const s = new Set(carry); if (!s.delete(id)) s.add(id); setPicked(s) }
  const add = () => {
    const n = name.trim()
    if (!n) return
    if (names.some(x => x.toLowerCase() === n.toLowerCase())) return setErr(`${n} is already in the list`)
    const old = prev.find(t => t.name.toLowerCase() === n.toLowerCase())
    if (old) { setPicked(new Set(carry).add(old.id)); setName(''); return setErr('') } // same team as last season: tick it instead
    setAdded([...added, n]); setName(''); setErr('')
  }
  const start = useMutation({
    mutationFn: () => api.startSeason({ season: next, league: lg.trim(), carry_team_ids: [...carry], new_teams: added }),
    onSuccess: r => {
      onStarted(`Season ${next} (${lg.trim()}) started with ${r.teams.length ? r.teams.join(', ') : 'no teams'}.`)
      setLeague(undefined); setPicked(undefined); setAdded([]); setErr('')
      return Promise.all(['teams', 'seasons'].map(k => qc.invalidateQueries({ queryKey: [k] })))
    },
    onError: (e: Error) => setErr(e.message),
  })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lg.trim()) return setErr('League name is required')
    const what = names.length ? `${names.length} team${names.length === 1 ? '' : 's'}: ${names.join(', ')}` : 'no teams'
    if (confirm(`Start Season ${next} in ${lg.trim()} with ${what}?`)) start.mutate()
  }

  return (
    <>
      <div className="rx-sec">Start Season {next}</div>
      <form className="rx-card rx-form" onSubmit={submit} aria-label={`Start Season ${next}`}>
        <label htmlFor="sl">League</label>
        <input id="sl" className="rx-input" maxLength={255} value={lg} onChange={e => setLeague(e.target.value)} placeholder="e.g. Volo" required />
        {prev.length > 0 && <fieldset className="rx-check">
          <legend>Carry over from Season {latest}</legend>
          {prev.map(t => (
            <label key={t.id}><input type="checkbox" checked={carry.has(t.id)} onChange={() => toggle(t.id)} />
              <span>{t.name}</span><small>{t.league}</small></label>
          ))}
        </fieldset>}
        <label htmlFor="nt">Add a new team</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="nt" className="rx-input" maxLength={255} value={name} placeholder="Opponent name"
            onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
          <button type="button" className="rx-btn ghost" onClick={add} disabled={!name.trim()}>Add</button>
        </div>
        {added.length > 0 && <div className="rx-totals" style={{ padding: 0, flexWrap: 'wrap' }} aria-label="New teams">
          {added.map(n => <span key={n}><b>{n}</b> <button type="button" className="rx-chipx" aria-label={`Remove ${n}`} onClick={() => setAdded(added.filter(x => x !== n))}>✕</button></span>)}
        </div>}
        <p className="rx-muted" style={{ margin: 0, fontSize: 13 }}>
          {names.length ? <>Season {next} starts with <b>{names.length}</b> team{names.length === 1 ? '' : 's'}, all 0-0.</> : <>Season {next} starts with no teams. Add them later on the Teams page.</>}
          {!names.includes(TEAM) && ' The Rhinos aren’t in it yet, so games can’t be logged until they are.'}
        </p>
        {err && <p className="rx-err" role="alert">{err}</p>}
        <div className="rx-acts"><button className="rx-btn" disabled={start.isPending || !lg.trim()}>{start.isPending ? 'Starting…' : `Start Season ${next}`}</button></div>
      </form>
    </>
  )
}
