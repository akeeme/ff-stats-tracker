'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminPage } from '@/components/admin-ui'
import { fmtRecord, record } from '@/lib/derive'

export default function SeasonsAdmin() {
  const qc = useQueryClient()
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.getTeams })
  const games = useQuery({ queryKey: ['games'], queryFn: api.getGames })
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>()
  const all = (teams.data ?? []).filter(t => !t.is_deleted)
  const seasons = [...new Set(all.map(t => t.season))].sort((a, b) => b - a)
  const latest = seasons[0] ?? 0
  const live = (games.data ?? []).filter(g => !g.is_deleted)
  const refresh = () => qc.invalidateQueries({ queryKey: ['teams'] })
  const end = useMutation({
    mutationFn: (s: number) => api.endSeason(s),
    onSuccess: (_, s) => { setMsg({ ok: true, text: `Season ${s} ended. Its teams are now inactive.` }); return refresh() },
    onError: (e: Error) => setMsg({ ok: false, text: e.message }),
  })
  const start = useMutation({
    mutationFn: () => api.copyTeamsToSeason(latest, latest + 1),
    onSuccess: r => { setMsg({ ok: true, text: `Season ${latest + 1} started with ${r.teams_copied ?? 'the'} teams from Season ${latest}.` }); return refresh() },
    onError: (e: Error) => setMsg({ ok: false, text: e.message }),
  })

  return (
    <AdminPage title="Seasons">
      {!teams.data ? <p className="rx-pad rx-muted">{teams.error ? 'Couldn’t load seasons.' : 'Loading…'}</p> : <>
        <div className="rx-sec">Start a season</div>
        <div className="rx-card rx-form">
          <p style={{ margin: 0 }}>Copies every team from Season {latest} into <b>Season {latest + 1}</b> with 0-0 records. Add players on the Players page afterwards.</p>
          <div className="rx-acts">
            <button className="rx-btn" disabled={start.isPending || !latest}
              onClick={() => confirm(`Start Season ${latest + 1} by copying Season ${latest}'s teams?`) && start.mutate()}>
              {start.isPending ? 'Starting…' : `Start Season ${latest + 1}`}</button>
          </div>
        </div>
        {msg && <p className={msg.ok ? 'rx-pad rx-muted' : 'rx-pad rx-err'} role="status">{msg.text}</p>}
        <div className="rx-sec">All seasons</div>
        <div className="rx-card">
          {seasons.map(s => {
            const ts = all.filter(t => t.season === s)
            const active = ts.some(t => t.is_active)
            const r = record(live, { season: s })
            return (
              <div key={s} className="rx-row">
                <span className="rx-grow"><b>Season {s}</b><small>{ts.length} teams · {ts[0]?.league ?? '—'} · Rhinos {fmtRecord(r)}</small></span>
                {active
                  ? <button className="rx-btn ghost sm" disabled={end.isPending} onClick={() => confirm(`End Season ${s}? Its teams are marked inactive.`) && end.mutate(s)}>End season</button>
                  : <span className="rx-muted" style={{ fontSize: 13 }}>Ended</span>}
              </div>
            )
          })}
        </div>
      </>}
    </AdminPage>
  )
}
