'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRhinos } from '@/hooks/use-rhinos'
import { Loading, SeasonChips, TopBar } from '@/components/rx'
import { fmtRecord, gameLabel, record, side, standings } from '@/lib/derive'

export default function GamesPage() {
  const { data: d, error } = useRhinos()
  const [pick, setPick] = useState<number | 'career'>()
  if (!d) return <><TopBar title="Games" /><Loading error={error} /></>
  const season = typeof pick === 'number' ? pick : d.seasons[0]
  const games = d.games.filter(g => g.season === season)
  const all = record(d.games, { season }), reg = record(d.games, { season, regularOnly: true })
  const table = standings(d.games, d.teams, season)

  return (
    <>
      <TopBar title="Games" right={<>{fmtRecord(all)} overall</>} />
      <SeasonChips seasons={d.seasons} value={season} onChange={setPick} />
      <div className="rx-sec">Season {season}<small>{fmtRecord(reg)} regular · {fmtRecord(all)} with playoffs</small></div>
      <div className="rx-card">
        {games.map(g => {
          const s = side(g)
          return (
            <Link key={g.id} href={`/games/${g.id}`} className="rx-row">
              <span className={`rx-wl ${s.res}`}>{s.res}</span>
              <span className="rx-grow"><b>vs {s.opp}</b>
                <small>{gameLabel(g)} · {d.gamesWithStats.has(g.id) ? 'Box score' : 'No stats (no film)'}</small></span>
              <span className="rx-num">{s.us}-{s.them}</span>
            </Link>
          )
        })}
      </div>

      <div className="rx-sec">Standings<small>regular season</small></div>
      <div className="rx-card rx-table">
        <table>
          <thead><tr><th>Team</th><th>W</th><th>L</th><th>T</th><th>PF</th><th>PA</th></tr></thead>
          <tbody>
            {table.map(r => (
              <tr key={r.name} className={r.name === 'Rhinos' ? 'rx-us' : ''}>
                <td>{r.name}{r.manual && <span title="Set by admin" aria-label="set by admin"> ✎</span>}</td>
                <td>{r.w}</td><td>{r.l}</td><td>{r.t || ''}</td><td>{r.manual ? '' : r.pf}</td><td>{r.manual ? '' : r.pa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="rx-pad rx-muted" style={{ fontSize: 12 }}>
        Computed from game scores. Only Rhinos games are recorded, so other teams&apos; records are partial unless marked ✎ (set by admin).
      </p>
    </>
  )
}
