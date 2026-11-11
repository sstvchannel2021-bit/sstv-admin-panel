import { useState } from 'react'
import { ArrowRight, CalendarClock, ChartColumn, Megaphone, UserCog } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Logo } from '../Layout.jsx'
import { MODULES } from '../data.js'
import { Button, Field, Input, form } from '../ui.jsx'
import { initials } from '../lib.js'

const CHIPS = [
  [CalendarClock, 'Timetable'],
  [Megaphone, 'Ad bookings'],
  [ChartColumn, 'Revenue reports'],
  [UserCog, 'Staff access'],
]

export default function Login() {
  const { users, actions } = useStore()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const enter = () => {
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.active)
    if (!u) return setError('Enter a username from the demo accounts')
    actions.login(u.id)
  }

  const summary = (u) => {
    if (u.role === 'owner') return 'Full access to everything'
    const count = MODULES.filter(([m]) => (u.permissions[m] ?? 'none') !== 'none').length
    return `${u.job}, can open ${count} of ${MODULES.length} areas`
  }

  return (
    <div className="grid min-h-full gap-3 p-3 lg:h-full lg:grid-cols-[1.15fr_1fr]">
      <section className="grain relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-7 sm:p-10">
        <span className="glow glow-a -right-24 -top-24 size-64 bg-gold/25 lg:size-96 lg:bg-gold/45" />
        <span className="glow glow-b -bottom-32 -left-20 size-72 bg-gold-deep/40 lg:size-[28rem] lg:bg-gold-deep/70" />

        <div className="stagger relative flex items-start justify-between gap-3">
          <Logo size="lg" />
          <span className="glass rounded-full px-3 py-1 text-xs font-medium text-white/80">Admin panel</span>
        </div>

        <div className="stagger relative z-10 lg:mb-[11vw]">
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-[56px]">
            Your whole channel, <span className="text-gold">one calm screen.</span>
          </h1>
          <ul className="mt-6 flex flex-wrap gap-2">
            {CHIPS.map(([Icon, label]) => (
              <li key={label} className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] text-white/90">
                <Icon size={14} className="text-gold" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <p aria-hidden="true" className="ghost-word pointer-events-none absolute -bottom-[3.2vw] left-6 hidden select-none whitespace-nowrap font-display text-[17vw] font-bold leading-none tracking-wide lg:block">
          SS TV
        </p>
      </section>

      <section className="flex items-center justify-center rounded-3xl bg-card p-6 sm:p-10">
        <div className="stagger w-full max-w-sm">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted">This is a demo, so no password is needed. Pick an account to see what that person can reach.</p>
          </div>
          <form onSubmit={form(enter)} className="mt-5 space-y-3">
            <Field label="Username"><Input value={username} onChange={(e) => { setUsername(e.target.value); setError('') }} autoComplete="off" /></Field>
            {error && <p role="alert" className="rise text-sm text-air">{error}</p>}
            <Button type="submit" className="w-full">Log in <ArrowRight size={16} /></Button>
          </form>
          <div>
            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted">Demo accounts</p>
            <ul className="mt-2 space-y-1">
              {users.filter((u) => u.active).map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => actions.login(u.id)} className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-paper">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-gold">{initials(u.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{u.name}</span>
                      <span className="block truncate text-xs text-muted">{summary(u)}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-muted opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
