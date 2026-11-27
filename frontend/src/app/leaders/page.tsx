'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRhinos } from '@/hooks/use-rhinos'
import { Avatar, Loading, SeasonChips, TopBar } from '@/components/rx'
import { LEADER_CATS, leaders } from '@/lib/derive'

export default function LeadersPage() {
  const { data: d, error } = useRhinos()
  const [pick, setPick] = useState<number | 'career'>()
  if (!d) return <><TopBar title="Leaders" /><Loading error={error} /></>
  const view = pick ?? d.seasons[0]
  const season = view === 'career' ? undefined : view

  return (
    <>
      <TopBar title="Leaders" right={view === 'career' ? 'All-time' : `Season ${view}`} />
      <SeasonChips seasons={d.seasons} value={view} onChange={setPick} career />
      {LEADER_CATS.map(c => {
        const list = leaders(d.rows, c.key, season, d.gameById, 5)
        return (
          <section key={c.key}>
            <div className="rx-sec">{c.label}</div>
            <div className="rx-card">
              {list.length === 0 && <p className="rx-pad rx-muted">No stats recorded.</p>}
              {list.map((x, i) => {
                const p = d.people.get(x.personId)
                return (
                  <Link key={x.personId} href={`/players/${x.personId}`} className="rx-row">
                    <span className="rx-muted" style={{ width: 16, fontWeight: 800 }}>{i + 1}</span>
                    <Avatar person={p} size={34} />
                    <span className="rx-grow"><b>{p?.name}</b><small>{x.line.gp} GP · {(x.value / x.line.gp).toFixed(1)} / game</small></span>
                    <span className="rx-num">{x.value}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
