'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { api, type ReactionType, type TargetCounts } from '@/lib/api'

// Many cards per page, one request: keys asked for in the same tick are fetched together.
let queue = new Map<string, ((c: TargetCounts) => void)[]>()
let failQueue: ((e: unknown) => void)[] = []
const EMPTY: TargetCounts = { counts: {}, mine: [] }
function loadCounts(target: string): Promise<TargetCounts> {
  return new Promise((resolve, reject) => {
    if (!queue.size) setTimeout(flush, 0)
    queue.set(target, [...(queue.get(target) ?? []), resolve])
    failQueue.push(reject)
  })
}
async function flush() {
  const batch = queue, fails = failQueue
  queue = new Map(); failQueue = []
  const keys = [...batch.keys()]
  try {
    const out: Record<string, TargetCounts> = {}
    for (let i = 0; i < keys.length; i += 100) Object.assign(out, await api.getReactionCounts(keys.slice(i, i + 100))) // API caps 100 targets
    for (const [k, fns] of batch) fns.forEach(f => f(out[k] ?? EMPTY))
  } catch (e) { fails.forEach(f => f(e)) }
}

export const useReactionTypes = () =>
  useQuery({ queryKey: ['reaction-types'], queryFn: () => api.getReactionTypes(), staleTime: 5 * 60_000 })

export function Glyph({ r, size = 22 }: { r: ReactionType; size?: number }) {
  return r.kind === 'image'
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={r.value} alt={r.label} width={size} height={size} className="rx-glyph" loading="lazy" />
    : <span role="img" aria-label={r.label} className="rx-glyph" style={{ fontSize: size * 0.9 }}>{r.value}</span>
}

const smile = <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="12" r="8" /><path d="M8 14s1 1.6 3 1.6 3-1.6 3-1.6M8.5 9.5h.01M13.5 9.5h.01M20 3v5M17.5 5.5h5" /></svg>

/** One small button per card ("🔥 12"). Opens a sheet: reactions on this card, then the full set. */
export function Reactions({ target, label }: { target: string; label: string }) {
  const qc = useQueryClient()
  const key = ['rx', target]
  const types = useReactionTypes()
  const q = useQuery({ queryKey: key, queryFn: () => loadCounts(target), staleTime: 30_000 })
  const dlg = useRef<HTMLDialogElement>(null)
  const [err, setErr] = useState('')
  const toggle = useMutation({
    mutationFn: (code: string) => api.toggleReaction(target, code),
    onMutate: async code => { // optimistic: the sheet answers instantly
      setErr('')
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<TargetCounts>(key) ?? EMPTY
      const on = !prev.mine.includes(code)
      const n = (prev.counts[code] ?? 0) + (on ? 1 : -1)
      const counts = { ...prev.counts, [code]: n }
      if (n <= 0) delete counts[code]
      qc.setQueryData<TargetCounts>(key, { counts, mine: on ? [...prev.mine, code] : prev.mine.filter(c => c !== code) })
      return { prev }
    },
    onError: (e: Error, _c, ctx) => { if (ctx) qc.setQueryData(key, ctx.prev); setErr(e.message) },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const all = types.data ?? []
  const byCode = new Map(all.map(r => [r.code, r]))
  const c = q.data ?? EMPTY
  const used = Object.entries(c.counts).filter(([code]) => byCode.has(code)).sort((a, b) => b[1] - a[1])
  const total = used.reduce((a, [, n]) => a + n, 0)
  const top = used.slice(0, 2).map(([code]) => byCode.get(code)!)
  const cats = [...new Set(all.map(r => r.category))]

  const pick = (r: ReactionType, n?: number) => {
    const on = c.mine.includes(r.code)
    return (
      <button key={r.code} type="button" className="rx-pick" aria-pressed={on} onClick={() => toggle.mutate(r.code)}
        aria-label={`${r.label}${n ? `, ${n}` : ''}${on ? ', yours, tap to remove' : ''}`}>
        <Glyph r={r} size={28} />{n !== undefined && <b>{n}</b>}
      </button>
    )
  }

  return (
    <>
      <button type="button" className="rx-rbtn" aria-haspopup="dialog" data-mine={c.mine.length > 0 || undefined}
        aria-label={`Reactions on ${label}: ${total}. Add a reaction`}
        onClick={e => { e.stopPropagation(); dlg.current?.showModal() }}>
        {top.length ? top.map(r => <Glyph key={r.code} r={r} size={16} />) : smile}
        <span>{total || ''}</span>
      </button>
      <dialog ref={dlg} className="rx-sheet" aria-label={`React to ${label}`}
        onClick={e => { if (e.target === e.currentTarget) dlg.current?.close() }}>
        <div className="rx-sheet-in">
          <div className="rx-sheet-h"><b>React</b><span className="rx-muted">{label}</span>
            <button type="button" className="rx-x" onClick={() => dlg.current?.close()} aria-label="Close">✕</button></div>
          {used.length > 0 && <>
            <div className="rx-sheet-k">On this card · {total}</div>
            <div className="rx-picks used">{used.map(([code, n]) => pick(byCode.get(code)!, n))}</div>
          </>}
          {cats.map(cat => (
            <section key={cat}>
              <div className="rx-sheet-k">{cats.length > 1 ? cat : 'All reactions'}</div>
              <div className="rx-picks">{all.filter(r => r.category === cat).map(r => pick(r))}</div>
            </section>
          ))}
          {types.isLoading && <p className="rx-muted" aria-busy="true">Loading…</p>}
          {(err || types.error) && <p className="rx-err" role="alert">{err || 'Couldn’t load reactions.'}</p>}
          <p className="rx-muted" style={{ fontSize: 12, marginTop: 10 }}>Tap to add, tap again to remove. One of each per device.</p>
        </div>
      </dialog>
    </>
  )
}

/** Row of #tags under a stat line. */
export function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return <span className="rx-tags">{tags.map(t => <span key={t}>#{t}</span>)}</span>
}
