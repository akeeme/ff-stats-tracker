'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Game, type Team } from '@/lib/api'
import { SeasonChips } from '@/components/rx'
import { AdminPage } from '@/components/admin-ui'
import { byRecent, gameLabel, seasonsOf, side, TEAM } from '@/lib/derive'

type GameType = Game['game_type']
const TYPES: [GameType, string][] = [['regular', 'Regular'], ['playoff', 'Playoff'], ['championship', 'Championship']]

export default function GamesAdmin() {
  const games = useQuery({ queryKey: ['games'], queryFn: api.getGames })
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.getTeams })
  const [pick, setPick] = useState<number>()
  const [open, setOpen] = useState<number | 'new'>()
  const list = (games.data ?? []).filter(g => !g.is_deleted).sort(byRecent)
  const seasons = [...new Set([...seasonsOf(list), ...(teams.data ?? []).map(t => t.season)])].sort((a, b) => b - a)
  const season = pick ?? seasons[0]
  const seasonTeams = (teams.data ?? []).filter(t => t.season === season && !t.is_deleted)

  return (
    <AdminPage title="Games" right={<button className="rx-btn sm" onClick={() => setOpen('new')}>+ Game</button>}>
      {!games.data || !teams.data ? <p className="rx-pad rx-muted">{games.error || teams.error ? 'Couldn’t load games.' : 'Loading…'}</p> : <>
        <SeasonChips seasons={seasons} value={season} onChange={v => { setPick(v as number); setOpen(undefined) }} />
        <div className="rx-cols">
          <div>
            {open === 'new' && <>
              <div className="rx-sec">New game · Season {season}</div>
              <GameForm season={season} teams={seasonTeams} onDone={() => setOpen(undefined)} />
            </>}
            <div className="rx-sec">Season {season}<small>{list.filter(g => g.season === season).length} games</small></div>
            <div className="rx-card">
              {list.filter(g => g.season === season).map(g => {
                const s = side(g)
                return (
                  <div key={g.id}>
                    <div className="rx-row">
                      <button className="rx-rowbtn" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? undefined : g.id)}>
                        <span className={`rx-wl ${s.res}`}>{s.res}</span>
                        <span className="rx-grow"><b>vs {s.opp}</b><small>{gameLabel(g)} · {s.us}-{s.them}</small></span>
                      </button>
                      <Link href={`/admin/stats?game=${g.id}`} className="rx-btn ghost sm">Log stats</Link>
                    </div>
                    {open === g.id && <GameForm season={season} teams={seasonTeams} game={g} onDone={() => setOpen(undefined)} />}
                  </div>
                )
              })}
              {!list.some(g => g.season === season) && <p className="rx-pad rx-muted">No games yet.</p>}
            </div>
          </div>
        </div>
      </>}
    </AdminPage>
  )
}

// Rhinos-only tracker: a game is Rhinos vs one opponent (team1 = Rhinos on new games).
function GameForm({ season, teams, game, onDone }: { season: number; teams: Team[]; game?: Game; onDone: () => void }) {
  const qc = useQueryClient()
  const s = game && side(game)
  const [f, setF] = useState({
    opp: s?.opp ?? '', week: String(game?.week ?? ''), type: (game?.game_type ?? 'regular') as GameType,
    us: s ? String(s.us) : '', them: s ? String(s.them) : '',
  })
  const [err, setErr] = useState('')
  const done = async () => { await qc.invalidateQueries({ queryKey: ['games'] }); onDone() }
  const save = useMutation({
    mutationFn: async () => {
      const us = Number(f.us) || 0, them = Number(f.them) || 0, week = Number(f.week)
      if (!week || week < 1) throw new Error('Week is required')
      if (!game) {
        if (!f.opp) throw new Error('Pick an opponent')
        const rh = teams.find(t => t.name === TEAM)
        if (!rh) throw new Error(`No ${TEAM} team in season ${season}. Add it on Teams first.`)
        return api.createGame({ team1_name: TEAM, team2_name: f.opp, team1_score: us, team2_score: them, week, season, game_type: f.type,
          league: rh.league, winning_team_name: us > them ? TEAM : them > us ? f.opp : undefined })
      }
      const [a, b] = s!.isHome ? [us, them] : [them, us]
      const win = a > b ? game.team1_id : b > a ? game.team2_id : undefined
      return api.updateGame(game.id, { week, game_type: f.type, team1_score: a, team2_score: b, ...(win ? { winning_team_id: win } : {}) }, game.version)
    },
    onSuccess: done,
    onError: (e: Error) => setErr(e.message),
  })
  const del = useMutation({ mutationFn: () => api.deleteGame(game!.id, game!.version), onSuccess: done, onError: (e: Error) => setErr(e.message) })
  const opps = teams.filter(t => t.name !== TEAM)
  return (
    <form className={`rx-form${game ? '' : ' rx-card'}`} onSubmit={e => { e.preventDefault(); setErr(''); save.mutate() }}>
      {!game && <>
        <label htmlFor="opp">Opponent</label>
        <select id="opp" className="rx-input" value={f.opp} onChange={e => setF({ ...f, opp: e.target.value })} required>
          <option value="" disabled>{opps.length ? 'Choose…' : 'No other teams this season'}</option>
          {opps.map(t => <option key={t.id}>{t.name}</option>)}
        </select>
      </>}
      <div className="rx-2">
        <div><label htmlFor={`wk${game?.id}`}>Week</label><input id={`wk${game?.id}`} className="rx-input" inputMode="numeric" value={f.week} onChange={e => setF({ ...f, week: e.target.value.replace(/\D/g, '') })} required /></div>
        <div><label htmlFor={`ty${game?.id}`}>Type</label>
          <select id={`ty${game?.id}`} className="rx-input" value={f.type} onChange={e => setF({ ...f, type: e.target.value as GameType })}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
      </div>
      <div className="rx-2">
        <div><label htmlFor={`us${game?.id}`}>{TEAM}</label><input id={`us${game?.id}`} className="rx-input" inputMode="numeric" value={f.us} onChange={e => setF({ ...f, us: e.target.value.replace(/\D/g, '') })} /></div>
        <div><label htmlFor={`th${game?.id}`}>{s?.opp ?? (f.opp || 'Opponent')}</label><input id={`th${game?.id}`} className="rx-input" inputMode="numeric" value={f.them} onChange={e => setF({ ...f, them: e.target.value.replace(/\D/g, '') })} /></div>
      </div>
      <div className="rx-acts">
        <button className="rx-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : game ? 'Save game' : 'Add game'}</button>
        <button type="button" className="rx-btn ghost" onClick={onDone}>Cancel</button>
        {game && <button type="button" className="rx-btn danger" style={{ marginLeft: 'auto' }} disabled={del.isPending}
          onClick={() => confirm(`Delete the game vs ${s!.opp}? Its stat rows stay in the database but won’t show.`) && del.mutate()}>Delete</button>}
      </div>
      {err && <p className="rx-err" role="alert">{err}</p>}
    </form>
  )
}
