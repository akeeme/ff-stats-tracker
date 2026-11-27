'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Player } from '@/lib/api'
import { Avatar, SeasonChips } from '@/components/rx'
import { AdminPage } from '@/components/admin-ui'
import { useRhinos } from '@/hooks/use-rhinos'
import { TEAM } from '@/lib/derive'

// Per-season roster rows. A new row whose name matches an existing player joins that person (server links canonical_player_id).
export default function PlayersAdmin() {
  const players = useQuery({ queryKey: ['players'], queryFn: api.getPlayers })
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.getTeams })
  const { data: d } = useRhinos()
  const [pick, setPick] = useState<number>()
  const [open, setOpen] = useState<number | 'new'>()
  const rows = (players.data ?? []).filter(p => !p.is_deleted)
  const seasons = [...new Set([...rows.map(p => p.season), ...(teams.data ?? []).filter(t => t.name === TEAM).map(t => t.season)])].sort((a, b) => b - a)
  const season = pick ?? seasons[0]
  const roster = rows.filter(p => p.season === season).sort((a, b) => a.name.localeCompare(b.name))
  const names = [...new Set(rows.map(p => p.name.trim()))].sort()

  return (
    <AdminPage title="Players" right={<button className="rx-btn sm" onClick={() => setOpen('new')}>+ Player</button>}>
      {!players.data ? <p className="rx-pad rx-muted">{players.error ? 'Couldn’t load players.' : 'Loading…'}</p> : <>
        <SeasonChips seasons={seasons} value={season} onChange={v => { setPick(v as number); setOpen(undefined) }} />
        <div className="rx-cols">
          <div>
            {open === 'new' && <>
              <div className="rx-sec">Add to Season {season} roster</div>
              <PlayerForm season={season} names={names} onDone={() => setOpen(undefined)} />
            </>}
            <div className="rx-sec">Season {season} roster<small>{roster.length} players</small></div>
            <div className="rx-card">
              {roster.map(p => (
                <div key={p.id}>
                  <div className="rx-row">
                    <button className="rx-rowbtn" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? undefined : p.id)}>
                      <Avatar person={d?.people.get(p.canonical_player_id ?? p.id) ?? { name: p.name }} size={36} />
                      <span className="rx-grow"><b>{p.name}</b><small>{p.jersey_number ? `#${p.jersey_number} · ` : ''}{p.is_active ? 'Active' : 'Inactive'}</small></span>
                    </button>
                    <span className="rx-muted">{open === p.id ? '▾' : '›'}</span>
                  </div>
                  {open === p.id && <PlayerForm season={season} names={names} player={p} onDone={() => setOpen(undefined)} />}
                </div>
              ))}
              {!roster.length && <p className="rx-pad rx-muted">No players this season yet.</p>}
            </div>
          </div>
        </div>
      </>}
    </AdminPage>
  )
}

function PlayerForm({ season, names, player, onDone }: { season: number; names: string[]; player?: Player; onDone: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ name: player?.name ?? '', jersey: player?.jersey_number ?? '', active: player?.is_active ?? true })
  const [err, setErr] = useState('')
  const done = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['players'] }), qc.invalidateQueries({ queryKey: ['people'] })]); onDone() }
  const save = useMutation({
    mutationFn: () => {
      const name = f.name.trim()
      if (!name) throw new Error('Name is required')
      return player
        ? api.updatePlayer(player.id, { name, jersey_number: f.jersey.trim(), is_active: f.active }, player.version)
        : api.createPlayer({ name, team_name: TEAM, season, jersey_number: f.jersey.trim() || undefined, is_active: f.active })
    },
    onSuccess: done,
    onError: (e: Error) => setErr(e.message),
  })
  const del = useMutation({ mutationFn: () => api.deletePlayer(player!.id, player!.version), onSuccess: done, onError: (e: Error) => setErr(e.message) })
  const id = player?.id ?? 'new'
  return (
    <form className={`rx-form${player ? '' : ' rx-card'}`} onSubmit={e => { e.preventDefault(); setErr(''); save.mutate() }}>
      <div className="rx-2">
        <div><label htmlFor={`n${id}`}>Name</label>
          <input id={`n${id}`} className="rx-input" list="rx-names" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required maxLength={255} /></div>
        <div><label htmlFor={`j${id}`}>Jersey #</label>
          <input id={`j${id}`} className="rx-input" inputMode="numeric" maxLength={3} value={f.jersey} onChange={e => setF({ ...f, jersey: e.target.value.replace(/\D/g, '') })} /></div>
      </div>
      <datalist id="rx-names">{names.map(n => <option key={n} value={n} />)}</datalist>
      {!player && <p className="rx-muted" style={{ fontSize: 12, margin: 0 }}>Pick an existing name to keep one profile across seasons.</p>}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', fontSize: 14, color: 'var(--rx-txt)' }}>
        <input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Active this season
      </label>
      <div className="rx-acts">
        <button className="rx-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : player ? 'Save player' : 'Add player'}</button>
        <button type="button" className="rx-btn ghost" onClick={onDone}>Cancel</button>
        {player && <button type="button" className="rx-btn danger" style={{ marginLeft: 'auto' }} disabled={del.isPending}
          onClick={() => confirm(`Remove ${player.name} from the Season ${season} roster?`) && del.mutate()}>Remove</button>}
      </div>
      {err && <p className="rx-err" role="alert">{err}</p>}
    </form>
  )
}
