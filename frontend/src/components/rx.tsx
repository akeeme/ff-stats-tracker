'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { api, type Game } from '@/lib/api'
import { useAdmin } from '@/providers/admin-provider'
import { gameLabel, impact, initials, side, statLine, type Person, type Row } from '@/lib/derive'
import type { Rhinos } from '@/hooks/use-rhinos'

const icons = {
  home: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 3 10v11h6v-6h6v6h6V10z" /></svg>,
  games: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  leaders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  roster: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5" /></svg>,
  log: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
}

const TABS = [
  { href: '/', label: 'Home', icon: icons.home, match: (p: string) => p === '/' },
  { href: '/games', label: 'Games', icon: icons.games, match: (p: string) => p.startsWith('/games') },
  { href: '/leaders', label: 'Leaders', icon: icons.leaders, match: (p: string) => p.startsWith('/leaders') },
  { href: '/roster', label: 'Roster', icon: icons.roster, match: (p: string) => p.startsWith('/roster') || p.startsWith('/players') },
]

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname() || '/'
  const { isAdmin } = useAdmin()
  useEffect(() => { document.body.classList.add('rx') }, [])
  const tabs = isAdmin ? [...TABS, { href: '/admin', label: 'Log', icon: icons.log, match: (p: string) => p.startsWith('/admin') || p.startsWith('/stat-entry') }] : TABS
  return (
    <>
      <div className="rx-app">{children}</div>
      <div className="rx-tabs">
        <nav aria-label="Main">
          {tabs.map(t => (
            <Link key={t.href} href={t.href} className="rx-tab" aria-current={t.match(path) ? 'page' : undefined}>{t.icon}{t.label}</Link>
          ))}
        </nav>
      </div>
    </>
  )
}

export function TopBar({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const router = useRouter()
  return (
    <header className="rx-top">
      {back && <button className="rx-back" onClick={() => router.back()} aria-label="Back" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}>‹</button>}
      <span>{title}</span>
      {right && <span className="rx-right">{right}</span>}
    </header>
  )
}

export function Loading({ error }: { error?: unknown }) {
  if (error) return <p className="rx-pad rx-err" role="alert">Couldn&apos;t load stats. Pull to refresh or try again in a minute.</p>
  return <div aria-busy="true" aria-label="Loading"><div className="rx-skel" /><div className="rx-skel" /></div>
}

export function Avatar({ person, size = 44 }: { person?: Pick<Person, 'name' | 'avatar_url'>; size?: number }) {
  const [broken, setBroken] = useState(false)
  const name = person?.name ?? '?'
  return (
    <span className="rx-av" style={{ width: size, height: size }}>
      {person?.avatar_url && !broken
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={person.avatar_url} alt="" onError={() => setBroken(true)} loading="lazy" />
        : <span style={{ fontSize: size * 0.38 }} aria-hidden="true">{initials(name)}</span>}
    </span>
  )
}

export function SeasonChips({ seasons, value, onChange, career }: { seasons: number[]; value: number | 'career'; onChange: (v: number | 'career') => void; career?: boolean }) {
  return (
    <div className="rx-chips" role="group" aria-label="Season">
      {career && <button className="rx-chip" aria-pressed={value === 'career'} onClick={() => onChange('career')}>Career</button>}
      {seasons.map(s => <button key={s} className="rx-chip" aria-pressed={value === s} onClick={() => onChange(s)}>Season {s}</button>)}
    </div>
  )
}

export function ResultBadge({ g }: { g: Game }) {
  const s = side(g)
  return <span className={`rx-badge ${s.res}`}>{s.res === 'W' ? 'Win' : s.res === 'L' ? 'Loss' : 'Tie'}</span>
}

export function ScoreCard({ g, hasStats, foot }: { g: Game; hasStats: boolean; foot?: ReactNode }) {
  const s = side(g)
  return (
    <Link href={`/games/${g.id}`} className="rx-card rx-score">
      <div className="rx-meta"><span>Season {g.season} · {gameLabel(g)} · {g.league}</span><ResultBadge g={g} /></div>
      <div className="rx-teams">
        <span className="rx-team">Rhinos</span>
        <span className="rx-pts" aria-label={`Rhinos ${s.us}, ${s.opp} ${s.them}`}>
          <span className={s.res === 'L' ? 'rx-dim' : ''}>{s.us}</span> <span className="rx-dim">–</span> <span className={s.res === 'W' ? 'rx-dim' : ''}>{s.them}</span>
        </span>
        <span className="rx-team">{s.opp}</span>
      </div>
      <div className="rx-foot">{hasStats ? foot : <span className="rx-nofilm">No stats recorded (no film)</span>}</div>
    </Link>
  )
}

export function PerfCarousel({ rows, d, label }: { rows: Row[]; d: Rhinos; label?: (i: number) => string }) {
  return (
    <div className="rx-carousel" role="list">
      {rows.map((r, i) => {
        const p = d.people.get(r.personId)
        const [a, b] = statLine(r)
        return (
          <Link role="listitem" key={r.id} href={`/players/${r.personId}`} className="rx-perf">
            <div className="rx-rank">{label ? label(i) : `#${i + 1} performance`} · {Math.round(impact(r))} pts</div>
            <div className="rx-who"><Avatar person={p} size={40} /><b>{p?.name ?? r.player_name}</b></div>
            <div className="rx-line">{a}<small>{b || ' '}</small></div>
          </Link>
        )
      })}
    </div>
  )
}

const EMOJI = ['🔥', '💪', '🦏', '🐐', '😂', '👏']

/** Reactions + MVP poll. Anonymous: the API keys both to a per-device httpOnly cookie and rate-limits by IP. */
export function Social({ g, d, candidates }: { g: Game; d: Rhinos; candidates: number[] }) {
  const qc = useQueryClient()
  const key = ['social', g.id]
  const q = useQuery({ queryKey: key, queryFn: () => api.getGameSocial(g.id), staleTime: 15_000 })
  const [voter, setVoter] = useState('')
  useEffect(() => { setVoter(localStorage.getItem('rx_voter') || '') }, [])
  const react = useMutation({ mutationFn: (e: string) => api.react(g.id, e), onSettled: () => qc.invalidateQueries({ queryKey: key }) })
  const vote = useMutation({ mutationFn: (pid: number) => api.voteMvp(g.id, pid, voter), onSettled: () => qc.invalidateQueries({ queryKey: key }) })
  const s = q.data
  const total = s?.mvp.reduce((a, x) => a + x.votes, 0) ?? 0
  const err = (react.error || vote.error) as Error | null
  return (
    <>
      <div className="rx-sec">Reactions</div>
      <div className="rx-card"><div className="rx-reacts">
        {EMOJI.map(e => {
          const on = s?.mine.includes(e) ?? false
          return <button key={e} className="rx-react" aria-pressed={on} disabled={react.isPending} onClick={() => react.mutate(e)} aria-label={`React ${e}`}>{e} {s?.reactions[e] ?? 0}</button>
        })}
      </div></div>
      {candidates.length > 0 && <>
        <div className="rx-sec">Game MVP<small>{total} vote{total === 1 ? '' : 's'}</small></div>
        <div className="rx-card rx-poll">
          {candidates.map(pid => {
            const p = d.people.get(pid)
            const n = s?.mvp.find(x => x.person_id === pid)?.votes ?? 0
            return (
              <button key={pid} className="rx-opt" aria-pressed={s?.my_vote === pid} onClick={() => vote.mutate(pid)} disabled={vote.isPending}>
                <span className="rx-bar" style={{ width: total ? `${(100 * n) / total}%` : 0 }} />
                <Avatar person={p} size={32} />
                <span className="rx-grow"><b>{p?.name}</b></span>
                <span className="rx-muted">{total ? Math.round((100 * n) / total) : 0}%</span>
              </button>
            )
          })}
        </div>
        <div className="rx-pad">
          <label className="rx-muted" style={{ fontSize: 12 }} htmlFor="rx-voter">Voting as (optional)</label>
          <select id="rx-voter" className="rx-input" style={{ marginTop: 6 }} value={voter}
            onChange={e => { setVoter(e.target.value); localStorage.setItem('rx_voter', e.target.value) }}>
            <option value="">Anonymous</option>
            {[...d.people.values()].filter(p => p.seasons.some(x => x.season === g.season)).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <p className="rx-muted" style={{ fontSize: 12, marginTop: 6 }}>One vote per device. You can change it.</p>
        </div>
      </>}
      {err && <p className="rx-pad rx-err" role="alert">{err.message}</p>}
    </>
  )
}
