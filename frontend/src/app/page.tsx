'use client'

import Link from 'next/link'
import { useRhinos } from '@/hooks/use-rhinos'
import { Avatar, Loading, PerfCarousel, ScoreCard, Social, TopBar } from '@/components/rx'
import { fmtRecord, gameLabel, leaders, record, side, statsForGame, topPerformances } from '@/lib/derive'

const HOME_LEADERS = [
  { key: 'passing_tds', label: 'Pass TD' }, { key: 'receiving_tds', label: 'Rec TD' },
  { key: 'interceptions', label: 'INT' }, { key: 'flag_pulls', label: 'Flag pulls' },
] as const

export default function Home() {
  const { data: d, error } = useRhinos()
  if (!d) return <><TopBar title="🦏 Rhinos" /><Loading error={error} /></>

  const latest = d.games[0]
  if (!latest) return <><TopBar title="🦏 Rhinos" /><p className="rx-pad rx-muted">No games yet.</p></>
  const season = latest.season
  const latestRows = statsForGame(d.rows, latest.id)
  // if the latest game has no film, still show the most recent game that does
  const filmed = latestRows.length ? latest : d.games.find(g => d.gamesWithStats.has(g.id))
  const perfRows = filmed ? topPerformances(statsForGame(d.rows, filmed.id)) : []
  const rec = record(d.games, { season })
  const champ = d.games.find(g => g.season === season && g.game_type === 'championship' && side(g).res === 'W')

  return (
    <>
      <TopBar title="🦏 Rhinos" right={`Season ${season}`} />
      <div className="rx-sec">Latest game</div>
      <ScoreCard g={latest} hasStats={latestRows.length > 0}
        foot={<>Box score and MVP vote ›</>} />

      {perfRows.length > 0 && filmed && <>
        <div className="rx-sec">Top performances
          <small>{filmed.id === latest.id ? gameLabel(filmed) : `from ${gameLabel(filmed)}, S${filmed.season}`}</small></div>
        <PerfCarousel rows={perfRows} d={d} />
      </>}

      <div className="rx-sec">Season {season}<Link href="/games">All games ›</Link></div>
      <div className="rx-tiles">
        <div className="rx-tile"><b>{fmtRecord(rec)}</b><span>Record</span>{champ && <em>🏆 Champions</em>}</div>
        <div className="rx-tile"><b>{rec.pf - rec.pa > 0 ? '+' : ''}{rec.pf - rec.pa}</b><span>Point diff</span><em>{rec.pf}–{rec.pa}</em></div>
        <div className="rx-tile"><b>{(rec.pf / Math.max(1, rec.w + rec.l + rec.t)).toFixed(1)}</b><span>Pts / game</span></div>
      </div>

      <div className="rx-sec">Leaders<Link href="/leaders">See all ›</Link></div>
      <div className="rx-card">
        {HOME_LEADERS.map(c => {
          const top = leaders(d.rows, c.key, season, d.gameById, 1)[0]
          if (!top) return null
          const p = d.people.get(top.personId)
          return (
            <Link key={c.key} href={`/players/${top.personId}`} className="rx-row">
              <Avatar person={p} size={36} />
              <span className="rx-grow"><b>{p?.name}</b><small>{c.label}</small></span>
              <span className="rx-num">{top.value}</span>
            </Link>
          )
        })}
      </div>

      <Social g={latest} d={d} candidates={latestRows.length ? topPerformances(latestRows, 4).map(r => r.personId) : []} />
    </>
  )
}
