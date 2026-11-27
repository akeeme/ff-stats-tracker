'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRhinos } from '@/hooks/use-rhinos'
import { Avatar, Loading, SeasonChips, TopBar } from '@/components/rx'
import { addLine, emptyLine, statLine } from '@/lib/derive'

export default function RosterPage() {
  const { data: d, error } = useRhinos()
  const [pick, setPick] = useState<number | 'career'>()
  if (!d) return <><TopBar title="Roster" /><Loading error={error} /></>
  const view = pick ?? d.seasons[0]
  const people = [...d.people.values()]
    .filter(p => view === 'career' || p.seasons.some(s => s.season === view))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <TopBar title="Roster" right={`${people.length} players`} />
      <SeasonChips seasons={d.seasons} value={view} onChange={setPick} career />
      <div className="rx-card" style={{ marginTop: 8 }}>
        {people.map(p => {
          const line = d.rows.filter(r => r.personId === p.id && (view === 'career' || d.gameById.get(r.game_id)?.season === view)).reduce(addLine, emptyLine())
          const jersey = p.seasons.find(s => s.season === view)?.jersey ?? [...p.seasons].reverse().find(s => s.jersey)?.jersey
          return (
            <Link key={p.id} href={`/players/${p.id}`} className="rx-row">
              <Avatar person={p} size={44} />
              <span className="rx-grow">
                <b>{p.name}{p.nickname && <span className="rx-muted" style={{ fontWeight: 600 }}> · {p.nickname}</span>}</b>
                <small>{line.gp ? statLine(line).filter(Boolean).join(' · ') : 'No stats recorded'}</small>
              </span>
              <span className="rx-num" style={{ fontSize: 14 }}>{jersey ? `#${jersey}` : ''}<small>{view === 'career' ? `${p.seasons.length} szn` : `${line.gp} GP`}</small></span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
