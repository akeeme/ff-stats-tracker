'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRhinos } from '@/hooks/use-rhinos'
import { Loading, PerfCarousel, ResultBadge, Social, TopBar } from '@/components/rx'
import { gameLabel, pct, side, statsForGame, topPerformances, type Row, type StatKey } from '@/lib/derive'

type Col = { key: StatKey | 'cmp'; label: string }
const SECTIONS: { title: string; show: (r: Row) => boolean; cols: Col[]; sort: StatKey }[] = [
  { title: 'Passing', show: r => r.passes_attempted > 0, sort: 'passing_tds',
    cols: [{ key: 'cmp', label: 'C/A' }, { key: 'passing_tds', label: 'TD' }, { key: 'interceptions_thrown', label: 'INT' }] },
  { title: 'Receiving', show: r => r.targets > 0 || r.receptions > 0, sort: 'receiving_tds',
    cols: [{ key: 'receptions', label: 'Rec' }, { key: 'targets', label: 'Tgt' }, { key: 'receiving_tds', label: 'TD' }, { key: 'drops', label: 'Drop' }, { key: 'first_downs', label: '1D' }] },
  { title: 'Rushing', show: r => r.rush_attempts > 0 || r.rushing_tds > 0, sort: 'rushing_tds',
    cols: [{ key: 'rush_attempts', label: 'Att' }, { key: 'rushing_tds', label: 'TD' }] },
  { title: 'Defense', show: r => r.flag_pulls + r.interceptions + r.pass_breakups + r.sacks + r.def_td + r.safeties > 0, sort: 'interceptions',
    cols: [{ key: 'flag_pulls', label: 'Pulls' }, { key: 'interceptions', label: 'INT' }, { key: 'pass_breakups', label: 'PBU' }, { key: 'sacks', label: 'Sack' }, { key: 'def_td', label: 'TD' }] },
]

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const { data: d, error } = useRhinos()
  if (!d) return <><TopBar title="Game" back /><Loading error={error} /></>
  const g = d.gameById.get(Number(id))
  if (!g) return <><TopBar title="Game" back /><p className="rx-pad rx-muted">Game not found. <Link href="/games">All games ›</Link></p></>

  const s = side(g)
  const rows = statsForGame(d.rows, g.id)
  const top = topPerformances(rows)
  const name = (r: Row) => d.people.get(r.personId)?.name ?? r.player_name

  return (
    <>
      <TopBar title={`vs ${s.opp}`} back right={`S${g.season} · ${gameLabel(g)}`} />
      <div className="rx-card rx-score" style={{ marginTop: 12 }}>
        <div className="rx-meta"><span>{g.league} · Season {g.season} · {gameLabel(g)}</span><ResultBadge g={g} /></div>
        <div className="rx-teams">
          <span className="rx-team">Rhinos</span>
          <span className="rx-pts">{s.us} <span className="rx-dim">–</span> {s.them}</span>
          <span className="rx-team">{s.opp}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rx-card rx-pad" style={{ marginTop: 12, textAlign: 'center' }}>
          <span className="rx-nofilm">No stats recorded (no film)</span>
          <p className="rx-muted" style={{ fontSize: 13, marginTop: 8 }}>The final score counts toward the record; there are no player stats for this one.</p>
        </div>
      ) : <>
        <div className="rx-sec">Top performances</div>
        <PerfCarousel rows={top} d={d} />
        {SECTIONS.map(sec => {
          const list = rows.filter(sec.show).sort((a, b) => b[sec.sort] - a[sec.sort])
          if (!list.length) return null
          return (
            <section key={sec.title}>
              <div className="rx-sec">{sec.title}</div>
              <div className="rx-card rx-table">
                <table>
                  <thead><tr><th>Player</th>{sec.cols.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
                  <tbody>{list.map(r => (
                    <tr key={r.id}>
                      <td><Link href={`/players/${r.personId}`}>{name(r)}</Link></td>
                      {sec.cols.map(c => <td key={c.key}>{c.key === 'cmp'
                        ? <>{r.passes_completed}/{r.passes_attempted}<small>{pct(r.passes_completed, r.passes_attempted)}</small></>
                        : r[c.key]}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          )
        })}
      </>}

      <Social g={g} d={d} candidates={top.slice(0, 4).map(r => r.personId)} />
    </>
  )
}
