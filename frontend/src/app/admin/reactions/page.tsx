'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type ReactionType } from '@/lib/api'
import { AdminPage } from '@/components/admin-ui'
import { Glyph } from '@/components/reactions'

const MAX_ICON = 500 * 1024
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32)

export default function ReactionsAdmin() {
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['reaction-types', 'all'], queryFn: () => api.getReactionTypes(true) })
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>()
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['reaction-types'] }), qc.invalidateQueries({ queryKey: ['rx'] })])
  const done = (text: string) => () => { setMsg({ ok: true, text }); return refresh() }
  const onError = (e: Error) => setMsg({ ok: false, text: e.message })

  const order = useMutation({ mutationFn: api.reorderReactionTypes, onSuccess: done('Order saved'), onError })
  const update = useMutation({ mutationFn: ({ code, ...b }: { code: string; active?: boolean; label?: string; category?: string }) => api.updateReactionType(code, b), onSuccess: done('Saved'), onError })
  const remove = useMutation({
    mutationFn: api.deleteReactionType,
    onSuccess: r => { setMsg({ ok: true, text: r.deleted ? 'Removed' : `Hidden instead of removed: it's been used ${r.uses} time${r.uses === 1 ? '' : 's'}, and those stay.` }); return refresh() },
    onError,
  })

  const items = list.data ?? []
  const move = (i: number, by: number) => {
    const codes = items.map(r => r.code)
    const j = i + by
    if (j < 0 || j >= codes.length) return
    ;[codes[i], codes[j]] = [codes[j], codes[i]]
    qc.setQueryData<ReactionType[]>(['reaction-types', 'all'], codes.map(c => items.find(r => r.code === c)!))
    order.mutate(codes)
  }

  return (
    <AdminPage title="Reactions">
      <div className="rx-cols"><div>
        <div className="rx-sec">Reaction set<small>{items.filter(r => r.active).length} shown</small></div>
        {!list.data ? <p className="rx-pad rx-muted">{list.error ? 'Couldn’t load reactions.' : 'Loading…'}</p> : (
          <div className="rx-card">
            {items.map((r, i) => (
              <div key={r.code} className="rx-row" style={{ opacity: r.active ? 1 : 0.55 }}>
                <Glyph r={r} size={32} />
                <span className="rx-grow"><b>{r.label}</b><small>:{r.code}: · {r.category} · {r.uses ?? 0} use{r.uses === 1 ? '' : 's'}{r.active ? '' : ' · hidden'}</small></span>
                <span className="rx-rowacts">
                  <button className="rx-btn ghost sm" aria-label={`Move ${r.label} up`} disabled={i === 0 || order.isPending} onClick={() => move(i, -1)}>↑</button>
                  <button className="rx-btn ghost sm" aria-label={`Move ${r.label} down`} disabled={i === items.length - 1 || order.isPending} onClick={() => move(i, 1)}>↓</button>
                  <button className="rx-btn ghost sm" disabled={update.isPending} onClick={() => update.mutate({ code: r.code, active: !r.active })}>{r.active ? 'Hide' : 'Show'}</button>
                  <button className="rx-btn danger sm" disabled={remove.isPending} aria-label={`Remove ${r.label}`}
                    onClick={() => confirm(r.uses ? `${r.label} has been used ${r.uses} times, so it will be hidden, not deleted. OK?` : `Remove ${r.label}?`) && remove.mutate(r.code)}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}
        {msg && <p className={msg.ok ? 'rx-pad rx-muted' : 'rx-pad rx-err'} role="status">{msg.text}</p>}
      </div><div>
        <AddReaction onAdded={done('Added')} onError={onError} />
      </div></div>
    </AdminPage>
  )
}

function AddReaction({ onAdded, onError }: { onAdded: () => void; onError: (e: Error) => void }) {
  const [kind, setKind] = useState<'unicode' | 'image'>('unicode')
  const [f, setF] = useState({ label: '', code: '', category: 'general', value: '' })
  const [file, setFile] = useState<File>()
  const [err, setErr] = useState('')
  const add = useMutation({
    mutationFn: () => {
      const b = new FormData()
      b.append('label', f.label); b.append('code', f.code || slug(f.label)); b.append('category', f.category)
      if (kind === 'image' && file) b.append('file', file)
      else b.append('value', f.value.trim())
      return api.createReactionType(b)
    },
    onSuccess: () => { setF({ label: '', code: '', category: f.category, value: '' }); setFile(undefined); onAdded() },
    onError,
  })
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const x = e.target.files?.[0]
    setErr(x && x.size > MAX_ICON ? 'Image is larger than 500 KB' : '')
    setFile(x && x.size <= MAX_ICON ? x : undefined)
  }
  const ready = f.label.trim() && (kind === 'image' ? !!file : !!f.value.trim())
  return (
    <>
      <div className="rx-sec">Add a reaction</div>
      <form className="rx-card rx-form" onSubmit={e => { e.preventDefault(); if (ready) add.mutate() }}>
        <div className="rx-seg" role="tablist" aria-label="Reaction type" style={{ margin: 0 }}>
          <button type="button" role="tab" aria-selected={kind === 'unicode'} onClick={() => setKind('unicode')}>Emoji</button>
          <button type="button" role="tab" aria-selected={kind === 'image'} onClick={() => setKind('image')}>Custom image</button>
        </div>
        <label htmlFor="rl">Name</label>
        <input id="rl" className="rx-input" maxLength={60} required value={f.label} placeholder="e.g. Clutch" onChange={e => setF({ ...f, label: e.target.value })} />
        {kind === 'unicode' ? <>
          <label htmlFor="rv">Emoji</label>
          <input id="rv" className="rx-input" maxLength={16} value={f.value} placeholder="Paste or type one emoji" onChange={e => setF({ ...f, value: e.target.value })} />
        </> : <>
          <label htmlFor="rf">Image (PNG, WebP or JPEG, max 500 KB)</label>
          <input id="rf" type="file" accept="image/png,image/webp,image/jpeg" className="rx-input" onChange={pick} />
          <p className="rx-muted" style={{ fontSize: 12, margin: 0 }}>Resized to 128×128 on the server and padded to a transparent square. Transparent PNGs look best.</p>
        </>}
        <div className="rx-2">
          <div><label htmlFor="rc">Code</label>
            <input id="rc" className="rx-input" maxLength={32} value={f.code} placeholder={slug(f.label) || 'auto'} onChange={e => setF({ ...f, code: slug(e.target.value) })} /></div>
          <div><label htmlFor="rg">Category</label>
            <input id="rg" className="rx-input" maxLength={30} value={f.category} onChange={e => setF({ ...f, category: e.target.value })} /></div>
        </div>
        <p className="rx-muted" style={{ fontSize: 12, margin: 0 }}>New reactions go to the end of the list. Categories only show as headings once there&apos;s more than one.</p>
        {err && <p className="rx-err" role="alert">{err}</p>}
        <div className="rx-acts"><button className="rx-btn" disabled={!ready || add.isPending}>{add.isPending ? 'Adding…' : 'Add reaction'}</button></div>
      </form>
    </>
  )
}
