'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdmin } from '@/providers/admin-provider'
import { useRhinos } from '@/hooks/use-rhinos'
import { api } from '@/lib/api'
import { Avatar, TopBar } from '@/components/rx'

export default function AdminPage() {
  const { isAdmin, isLoading, login, logout } = useAdmin()
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (isLoading) return <TopBar title="Admin" />
  if (!isAdmin) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy(true); setErr('')
      try { await login(key); setKey('') } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
    }
    return (
      <>
        <TopBar title="Admin" />
        <form className="rx-pad" onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
          <label htmlFor="key" className="rx-muted">Admin key</label>
          <input id="key" type="password" autoComplete="current-password" className="rx-input" value={key} onChange={e => setKey(e.target.value)} required />
          <button className="rx-btn" disabled={busy || !key}>{busy ? 'Signing in…' : 'Sign in'}</button>
          {err && <p className="rx-err" role="alert">{err}</p>}
          <p className="rx-muted" style={{ fontSize: 12 }}>The key is exchanged for a 14-day session cookie on this device. It isn&apos;t stored in the browser.</p>
        </form>
      </>
    )
  }
  return (
    <>
      <TopBar title="Admin" right={<button onClick={() => logout()} style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>Sign out</button>} />
      <div className="rx-sec">Log stats</div>
      <div className="rx-card">
        {[['/stat-entry', 'Stat entry', 'Enter a game\'s box score'], ['/admin/games', 'Games', 'Add games and scores'],
          ['/admin/players', 'Players', 'Per-season roster rows'], ['/teams', 'Teams', 'Teams and manual records'], ['/seasons', 'Seasons', 'Start or end a season']]
          .map(([href, t, s]) => <Link key={href} href={href} className="rx-row"><span className="rx-grow"><b>{t}</b><small>{s}</small></span><span className="rx-muted">›</span></Link>)}
      </div>
      <PeopleEditor />
    </>
  )
}

function PeopleEditor() {
  const { data: d } = useRhinos()
  const qc = useQueryClient()
  const [sel, setSel] = useState<number>()
  const [form, setForm] = useState({ nickname: '', bio: '', avatar_url: '' })
  const [msg, setMsg] = useState('')
  if (!d) return null
  const people = [...d.people.values()].sort((a, b) => a.name.localeCompare(b.name))
  const choose = (id: number) => {
    const p = d.people.get(id)!
    setSel(id); setMsg('')
    setForm({ nickname: p.nickname ?? '', bio: p.bio ?? '', avatar_url: p.avatar_url ?? '' })
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await api.updatePerson(sel!, form); await qc.invalidateQueries({ queryKey: ['people'] }); setMsg('Saved') }
    catch (x) { setMsg((x as Error).message) }
  }
  return (
    <>
      <div className="rx-sec">Player profiles</div>
      <form className="rx-card rx-pad" onSubmit={save} style={{ display: 'grid', gap: 10 }}>
        <label htmlFor="who" className="rx-muted">Player</label>
        <select id="who" className="rx-input" value={sel ?? ''} onChange={e => choose(Number(e.target.value))}>
          <option value="" disabled>Choose…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {sel && <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Avatar person={{ name: d.people.get(sel)!.name, avatar_url: form.avatar_url }} size={56} /><span className="rx-muted" style={{ fontSize: 12 }}>Photo upload: next step (see REPORT-2). For now paste an https URL from the avatar bucket.</span></div>
          <label htmlFor="nick" className="rx-muted">Nickname</label>
          <input id="nick" className="rx-input" maxLength={60} value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          <label htmlFor="bio" className="rx-muted">Bio / shoutout</label>
          <textarea id="bio" className="rx-input" maxLength={280} rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          <label htmlFor="av" className="rx-muted">Avatar URL</label>
          <input id="av" className="rx-input" inputMode="url" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
          <button className="rx-btn">Save</button>
          {msg && <p className={msg === 'Saved' ? 'rx-muted' : 'rx-err'} role="status">{msg}</p>}
        </>}
      </form>
    </>
  )
}
