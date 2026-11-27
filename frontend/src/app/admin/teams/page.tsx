'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Team } from '@/lib/api'
import { SeasonChips } from '@/components/rx'
import { AdminPage } from '@/components/admin-ui'
import { fmtRecord, standings } from '@/lib/derive'

export default function TeamsAdmin() {
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.getTeams })
  const games = useQuery({ queryKey: ['games'], queryFn: api.getGames })
  const started = useQuery({ queryKey: ['seasons'], queryFn: api.getSeasons }) // seasons started with no teams yet
  const [pick, setPick] = useState<number>()
  const [open, setOpen] = useState<number | 'new'>()
  const all = (teams.data ?? []).filter(t => !t.is_deleted)
  const seasons = [...new Set([...all.map(t => t.season), ...(started.data ?? []).map(s => s.season)])].sort((a, b) => b - a)
  const season = pick ?? seasons[0]
  const list = all.filter(t => t.season === season).sort((a, b) => a.name.localeCompare(b.name))
  const computed = new Map(standings((games.data ?? []).filter(g => !g.is_deleted), [], season).map(r => [r.name, r]))

  return (
    <AdminPage title="Teams" right={<button className="rx-btn sm" onClick={() => setOpen('new')}>+ Team</button>}>
      {!teams.data ? <p className="rx-pad rx-muted">{teams.error ? 'Couldn’t load teams.' : 'Loading…'}</p> : <>
        <SeasonChips seasons={seasons} value={season} onChange={v => { setPick(v as number); setOpen(undefined) }} />
        <div className="rx-cols">
          <div>
            {open === 'new' && <>
              <div className="rx-sec">New team · Season {season}</div>
              <TeamForm season={season} league={started.data?.find(s => s.season === season)?.league ?? list[0]?.league ?? ''} onDone={() => setOpen(undefined)} />
            </>}
            <div className="rx-sec">Season {season}<small>record from games · ✎ = manual</small></div>
            <div className="rx-card">
              {list.map(t => {
                const c = computed.get(t.name)
                return (
                  <div key={t.id}>
                    <div className="rx-row">
                      <button className="rx-rowbtn" aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? undefined : t.id)}>
                        <span className="rx-grow"><b>{t.name}</b><small>{t.league}{t.is_active ? '' : ' · inactive'}</small></span>
                      </button>
                      <span className="rx-num" style={{ fontSize: 15 }}>
                        {t.record_manual ? `${fmtRecord({ w: t.wins, l: t.losses, t: t.ties })} ✎` : c ? fmtRecord(c) : '0-0'}
                        <small>{t.record_manual ? 'manual' : 'regular season'}</small>
                      </span>
                    </div>
                    {open === t.id && <TeamForm season={season} league={t.league} team={t} onDone={() => setOpen(undefined)} />}
                  </div>
                )
              })}
              {!list.length && <p className="rx-pad rx-muted">No teams this season. Use + Team to add them.</p>}
            </div>
          </div>
        </div>
      </>}
    </AdminPage>
  )
}

function TeamForm({ season, league, team, onDone }: { season: number; league: string; team?: Team; onDone: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({
    name: team?.name ?? '', league: team?.league ?? league, manual: team?.record_manual ?? false,
    w: String(team?.wins ?? 0), l: String(team?.losses ?? 0), t: String(team?.ties ?? 0), active: (team?.is_active ?? 1) === 1,
  })
  const [err, setErr] = useState('')
  const done = async () => { await qc.invalidateQueries({ queryKey: ['teams'] }); onDone() }
  const n = (v: string) => Number(v) || 0
  const save = useMutation({
    mutationFn: () => {
      if (!f.name.trim() || !f.league.trim()) throw new Error('Name and league are required')
      const body = { name: f.name.trim(), league: f.league.trim(), wins: n(f.w), losses: n(f.l), ties: n(f.t), is_active: f.active ? 1 : 0 }
      return team ? api.updateTeam(team.id, { ...body, record_manual: f.manual }, team.version) : api.createTeam({ ...body, season })
    },
    onSuccess: done,
    onError: (e: Error) => setErr(e.message),
  })
  const del = useMutation({ mutationFn: () => api.deleteTeam(team!.id, team!.version), onSuccess: done, onError: (e: Error) => setErr(e.message) })
  const id = team?.id ?? 'new'
  const num = (k: 'w' | 'l' | 't', label: string) => (
    <div><label htmlFor={`${k}${id}`}>{label}</label>
      <input id={`${k}${id}`} className="rx-input" inputMode="numeric" value={f[k]} disabled={!!team && !f.manual}
        onChange={e => setF({ ...f, [k]: e.target.value.replace(/\D/g, '') })} /></div>
  )
  return (
    <form className={`rx-form${team ? '' : ' rx-card'}`} onSubmit={e => { e.preventDefault(); setErr(''); save.mutate() }}>
      <div className="rx-2">
        <div><label htmlFor={`tn${id}`}>Name</label><input id={`tn${id}`} className="rx-input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required /></div>
        <div><label htmlFor={`tl${id}`}>League</label><input id={`tl${id}`} className="rx-input" value={f.league} onChange={e => setF({ ...f, league: e.target.value })} required /></div>
      </div>
      {team && <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', fontSize: 14, color: 'var(--rx-txt)' }}>
        <input type="checkbox" checked={f.manual} onChange={e => setF({ ...f, manual: e.target.checked })} /> Use a manual record (we only track Rhinos games, so other teams&apos; computed records are partial)
      </label>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>{num('w', 'Wins')}{num('l', 'Losses')}{num('t', 'Ties')}</div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', fontSize: 14, color: 'var(--rx-txt)' }}>
        <input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Active
      </label>
      <div className="rx-acts">
        <button className="rx-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : team ? 'Save team' : 'Add team'}</button>
        <button type="button" className="rx-btn ghost" onClick={onDone}>Cancel</button>
        {team && <button type="button" className="rx-btn danger" style={{ marginLeft: 'auto' }} disabled={del.isPending}
          onClick={() => confirm(`Delete ${team.name} (Season ${season})?`) && del.mutate()}>Delete</button>}
      </div>
      {err && <p className="rx-err" role="alert">{err}</p>}
    </form>
  )
}
