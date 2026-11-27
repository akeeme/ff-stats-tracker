'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useRhinos } from '@/hooks/use-rhinos'
import { Avatar, Loading, PhotoUpload, SeasonChips, TopBar } from '@/components/rx'
import { Reactions, Tags } from '@/components/reactions'
import { hashtags, profileHashtags } from '@/lib/hashtags'
import { addLine, careerRank, emptyLine, gameLabel, pct, side, statLine, totalTD, type Row, type StatKey } from '@/lib/derive'

const SIG: [StatKey, string][] = [['passing_tds', 'Pass TD'], ['receiving_tds', 'Rec TD'], ['rushing_tds', 'Rush TD'],
  ['interceptions', 'INT'], ['pass_breakups', 'PBU'], ['flag_pulls', 'Flag pulls']]

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const { data: d, error } = useRhinos()
  const [view, setView] = useState<number | 'career'>('career')
  if (!d) return <><TopBar title="Roster" back /><Loading error={error} /></>
  const person = d.people.get(Number(id))
  if (!person) return <><TopBar title="Roster" back /><p className="rx-pad rx-muted">Player not found. <Link href="/roster">Roster ›</Link></p></>

  const seasons = [...new Set(person.seasons.map(s => s.season))].sort((a, b) => b - a)
  const mine = d.rows.filter(r => r.personId === person.id)
  const inView = (r: Row) => view === 'career' || d.gameById.get(r.game_id)?.season === view
  const line = mine.filter(inView).reduce(addLine, emptyLine())
  const career = mine.reduce(addLine, emptyLine())
  const jersey = [...person.seasons].reverse().find(s => s.jersey)?.jersey

  // signature stat: best all-time rank among the stats this person actually has
  const sig = SIG.filter(([k]) => career[k] > 0).map(([k, label]) => ({ k, label, v: career[k], r: careerRank(d.rows, person.id, k) }))
    .sort((a, b) => a.r - b.r || b.v - a.v)[0]
  const best = [...mine].sort((a, b) => totalTD(b) - totalTD(a) || b.flag_pulls - a.flag_pulls)[0]
  const bestGame = best && d.gameById.get(best.game_id)
  const pos = [career.passes_attempted > 40 && 'QB', career.targets > 20 && 'WR', career.interceptions + career.pass_breakups > 5 && 'DB'].filter(Boolean).join(' · ')

  const myGames = new Map(mine.map(r => [r.game_id, r]))
  const tags = profileHashtags(mine.filter(inView))
  const log = d.games.filter(g => seasons.includes(g.season) && (view === 'career' || g.season === view))
  const res = log.filter(g => myGames.has(g.id)).reduce((a, g) => (a[side(g).res]++, a), { W: 0, L: 0, T: 0 })
  const champs = d.games.filter(g => g.game_type === 'championship' && side(g).res === 'W' && seasons.includes(g.season)).map(g => g.season)
  const badges = [
    ...champs.map(s => `🏆 Champion · S${s}`),
    best && best.passing_tds >= 10 && '🔟 Double-digit TD game',
    career.def_td > 0 && career.passing_tds + career.receiving_tds > 0 && '🔁 Two-way scorer',
    career.interceptions >= 5 && `🦅 Ball hawk · ${career.interceptions} INT`,
    career.gp >= 20 && `🧱 Iron Rhino · ${career.gp} games`,
    sig?.r === 1 && `👑 All-time #1 · ${sig.label}`,
    Math.min(...seasons) === Math.min(...d.seasons) && '🦏 Original Rhino',
  ].filter(Boolean) as string[]

  return (
    <>
      <TopBar title="Roster" back right={<Share name={person.name} />} />
      <section className="rx-hero">
        {jersey && <div className="rx-jn" aria-hidden="true">#{jersey}</div>}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar person={person} size={84} />
          <div>
            <h1>{person.name}</h1>
            {person.nickname && <div className="rx-nick">&ldquo;{person.nickname}&rdquo;</div>}
            <div className="rx-sub">{jersey && <b>#{jersey} · </b>}{pos && `${pos} · `}Rhinos since S{Math.min(...seasons)}</div>
          </div>
        </div>
        <PhotoUpload personId={person.id} hasPhoto={!!person.avatar_url} />
        {person.bio && <p className="rx-sub" style={{ marginTop: 10 }}>{person.bio}</p>}
        {tags.length > 0 && <div className="rx-tags lg" aria-label="Most earned hashtags">{tags.map(t => <span key={t.tag}>#{t.tag}{t.n > 1 && <small> ×{t.n}</small>}</span>)}</div>}
        <div className="rx-bar"><Reactions target={`person:${person.id}`} label={person.name} /></div>
        {sig && <div className="rx-sig"><b>{sig.v}</b><div>Signature stat<strong>{sig.label}, career</strong></div><span className="rx-rk">#{sig.r} all-time</span></div>}
      </section>
      {badges.length > 0 && <div className="rx-pills">{badges.map(b => <span key={b} className="rx-pill">{b}</span>)}</div>}

      <SeasonChips seasons={seasons} value={view} onChange={setView} career />
      {line.gp === 0 ? <p className="rx-pad rx-muted">No stats recorded for this season (no film).</p> : (
        <div className="rx-tiles" style={{ marginTop: 8 }}>
          <div className="rx-tile"><b>{line.gp}</b><span>Games</span><em>{res.W}-{res.L}{res.T ? `-${res.T}` : ''} in games played</em></div>
          <div className="rx-tile"><b>{totalTD(line)}</b><span>Total TD</span><em>{(totalTD(line) / line.gp).toFixed(1)} / game</em></div>
          {line.passes_attempted > 0
            ? <div className="rx-tile"><b>{line.passing_tds}</b><span>Pass TD</span><em>{line.passes_completed}/{line.passes_attempted} · {pct(line.passes_completed, line.passes_attempted)}</em></div>
            : <div className="rx-tile"><b>{pct(line.receptions, line.targets)}</b><span>Catch %</span><em>{line.receptions}/{line.targets}</em></div>}
          <div className="rx-tile"><b>{line.receiving_tds}</b><span>Rec TD</span><em>{line.receptions} rec</em></div>
          <div className="rx-tile"><b>{line.rushing_tds}</b><span>Rush TD</span><em>{line.rush_attempts} att</em></div>
          <div className="rx-tile"><b>{line.interceptions}</b><span>INT (def)</span><em>{line.pass_breakups} PBU · {line.flag_pulls} pulls</em></div>
        </div>
      )}

      {best && bestGame && view === 'career' && <>
        <div className="rx-sec">Best game</div>
        <Link href={`/games/${bestGame.id}`} className="rx-best">
          <div className="rx-k">★ Career high · {totalTD(best)} TD</div>
          <h3>vs {side(bestGame).opp}</h3>
          <div className="rx-muted" style={{ fontSize: 13 }}>S{bestGame.season} · {gameLabel(bestGame)} · {side(bestGame).res} {side(bestGame).us}-{side(bestGame).them}</div>
          <div className="rx-ln">{statLine(best)[0]}<small>{statLine(best)[1] || ' '}</small></div>
        </Link>
      </>}

      <div className="rx-sec">Season by season</div>
      <div className="rx-card rx-table">
        <table>
          <thead><tr><th>Season</th><th>GP</th><th>Pass TD</th><th>Cmp%</th><th>Rec</th><th>Rec TD</th><th>Rush TD</th><th>INT</th><th>PBU</th><th>Pulls</th></tr></thead>
          <tbody>
            {seasons.map(s => {
              const l = mine.filter(r => d.gameById.get(r.game_id)?.season === s).reduce(addLine, emptyLine())
              return <tr key={s}><td>S{s}</td><td>{l.gp}</td><td>{l.passing_tds}</td><td>{pct(l.passes_completed, l.passes_attempted)}</td><td>{l.receptions}</td><td>{l.receiving_tds}</td><td>{l.rushing_tds}</td><td>{l.interceptions}</td><td>{l.pass_breakups}</td><td>{l.flag_pulls}</td></tr>
            })}
            <tr className="rx-tot"><td>Career</td><td>{career.gp}</td><td>{career.passing_tds}</td><td>{pct(career.passes_completed, career.passes_attempted)}</td><td>{career.receptions}</td><td>{career.receiving_tds}</td><td>{career.rushing_tds}</td><td>{career.interceptions}</td><td>{career.pass_breakups}</td><td>{career.flag_pulls}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="rx-sec">Game log</div>
      <div className="rx-card">
        {log.map(g => {
          const s = side(g), r = myGames.get(g.id)
          const [a, b] = r ? statLine(r) : ['', '']
          return (
            <div key={g.id} className="rx-logrow">
              <Link href={`/games/${g.id}`} className="rx-row">
                <span className={`rx-wl ${s.res}`}>{s.res}</span>
                <span className="rx-grow"><b>vs {s.opp}</b><small>S{g.season} · {gameLabel(g)} · {s.us}-{s.them}</small></span>
                {r ? <span className="rx-num" style={{ fontSize: 13, maxWidth: '52%' }}>{a}<small>{b}</small></span>
                  : <span className="rx-nofilm">{d.gamesWithStats.has(g.id) ? 'Did not play' : 'No film'}</span>}
              </Link>
              {r && <div className="rx-bar"><Reactions target={`stat:${r.id}`} label={`${person.name} vs ${s.opp}`} /><Tags tags={hashtags(r)} /></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Share({ name }: { name: string }) {
  const share = () => {
    const data = { title: `${name} · Rhinos`, url: location.href }
    if (navigator.share) navigator.share(data).catch(() => {})
    else navigator.clipboard?.writeText(location.href)
  }
  return <button onClick={share} style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>Share ↗</button>
}
