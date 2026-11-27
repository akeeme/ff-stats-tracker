'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useAdmin } from '@/providers/admin-provider'
import { TopBar } from '@/components/rx'

/** Wraps every /admin/* screen: wide layout, sign-in prompt when there's no admin session. */
export function AdminPage({ title, back = true, right, children }: { title: string; back?: boolean; right?: ReactNode; children: ReactNode }) {
  const { isAdmin, isLoading } = useAdmin()
  return (
    <div className="rx-admin">
      <TopBar title={title} back={back} right={isAdmin ? right : undefined} />
      {isLoading ? <div aria-busy="true" aria-label="Loading"><div className="rx-skel" /></div>
        : !isAdmin ? <p className="rx-pad rx-muted">Admin only. <Link href="/admin" className="rx-link">Sign in ›</Link></p>
        : children}
    </div>
  )
}

/** Big −/+ stepper with a typed value in the middle (film review: tap fast, or type a big number). */
export function Stepper({ label, who, value, onChange, changed, warn }: {
  label: string; who: string; value: number; onChange: (v: number) => void; changed?: boolean; warn?: boolean
}) {
  const set = (v: number) => onChange(Math.max(0, Math.min(999, Math.round(v) || 0)))
  return (
    <div className={`rx-step${changed ? ' changed' : ''}${warn ? ' warn' : ''}`}>
      <span className="rx-step-l">{label}</span>
      <div className="rx-step-c">
        <button type="button" onClick={() => set(value - 1)} disabled={value <= 0} aria-label={`${label} minus one for ${who}`}>−</button>
        <input inputMode="numeric" pattern="[0-9]*" value={value} aria-label={`${label} for ${who}`}
          onFocus={e => e.target.select()} onChange={e => set(Number(e.target.value.replace(/\D/g, '')))} />
        <button type="button" onClick={() => set(value + 1)} aria-label={`${label} plus one for ${who}`}>+</button>
      </div>
    </div>
  )
}

export function SaveState({ state }: { state: { kind: 'idle' | 'clean' | 'dirty' | 'saving' | 'saved' | 'error'; text?: string } }) {
  const label = { idle: 'No changes', clean: 'No changes', dirty: state.text, saving: 'Saving…', saved: 'All changes saved ✓', error: state.text }[state.kind]
  return <span className={`rx-save ${state.kind}`} role="status" aria-live="polite">{label}</span>
}
