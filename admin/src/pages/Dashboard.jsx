import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Play, Plus, Radio, Square } from 'lucide-react'
import { bookingMoney, monthSeries, useStore } from '../store.jsx'
import { addDays, duration, fmtDate, fmtDay, fmtMonth, fmtMonthLong, fmtStamp, initials, nowMinutes, rupees, time12, today } from '../lib.js'
import { Badge, Button, Card, Empty, PageHead, Stat, useCountUp } from '../ui.jsx'

function RevenuePills({ months }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...months.map((m) => m.collected), 1)
  const best = Math.max(...months.map((m) => m.collected))
  const shown = hover ?? months.at(-1)
  return (
    <>
      <p className="mb-3 text-[13px] text-muted">
        <span className="font-medium text-text">{fmtMonthLong(shown.month)}</span> collected <span className="tnum font-medium text-text">{rupees(shown.collected)}</span>
      </p>
      <div className="flex h-44 items-end justify-between gap-2 sm:gap-3">
        {months.map((m, i) => {
          const isNow = i === months.length - 1
          const isBest = m.collected === best && best > 0
          return (
            <div key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <button
                type="button" aria-label={`${fmtMonthLong(m.month)}, ${rupees(m.collected)}`}
                onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(m)} onBlur={() => setHover(null)}
                style={{ height: `${Math.max((m.collected / max) * 100, 14)}%`, animationDelay: `${i * 60}ms` }}
                className={`grow-bar w-full max-w-14 rounded-full transition-[filter] hover:brightness-90 ${isNow ? 'bg-gold' : isBest ? 'bg-ink' : 'hatch border border-line'}`}
              />
              <span className="text-xs text-muted">{fmtMonth(m.month)}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Gauge({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  const pct = useCountUp(Math.round((parts[0].value / total) * 100))
  let start = 0
  return (
    <div>
      <div className="relative mx-auto max-w-64">
        <svg viewBox="0 0 200 112" className="w-full" aria-hidden="true">
          <defs>
            <pattern id="gauge-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#f5f2ea" /><rect width="2" height="6" fill="#c3b9a5" />
            </pattern>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f5f2ea" strokeWidth="24" strokeLinecap="round" />
          {parts.map((p) => {
            const len = (p.value / total) * 100
            const el = (
              <path
                key={p.label} d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={p.stroke} strokeWidth="24" pathLength="100"
                className="draw" strokeDasharray={`${len} 100`} strokeDashoffset={-start} style={{ '--from': len - start, animationDelay: '150ms' }}
              />
            )
            start += len
            return el
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="tnum text-[34px] font-semibold leading-none tracking-tight">{pct}%</p>
          <p className="mt-1 text-xs text-muted">Collected</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${p.dot}`} /> {p.label} <span className="tnum font-medium text-text">{rupees(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ShiftTimer() {
  const { attendance, user, actions } = useStore()
  const open = attendance.find((a) => a.userId === user.id && a.date === today() && !a.out)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const secs = open ? Math.max(Math.floor((now - new Date(open.in)) / 1000), 0) : 0
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <section className="hero-ink flex flex-col justify-between rounded-2xl p-5 text-white">
      <h2 className="text-[17px] font-semibold">My shift</h2>
      <p className="tnum my-4 font-mono text-4xl font-medium tracking-tight">{pad(Math.floor(secs / 3600))}:{pad(Math.floor(secs / 60) % 60)}:{pad(secs % 60)}</p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-white/60">{open ? `Started at ${fmtStamp(open.in)}` : 'Not started today'}</p>
        {open ? (
          <button type="button" aria-label="Finish work" title="Finish work" onClick={() => { actions.clockOut(); actions.flash('Finish time saved') }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-air text-white transition-transform hover:scale-105 active:scale-90"><Square size={16} fill="currentColor" /></button>
        ) : (
          <button type="button" aria-label="Start work" title="Start work" onClick={() => { actions.clockIn(); actions.flash('Start time saved') }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-ink transition-transform hover:scale-105 active:scale-90"><Play size={17} fill="currentColor" /></button>
        )}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const state = useStore()
  const { user, canView, canManage, schedule, bookings, payments, expenses, attendance, users, clients, logbook } = state
  const navigate = useNavigate()
  const t = today()
  const month = t.slice(0, 7)
  const now = nowMinutes()
  const day = [...(schedule[t] ?? [])].sort((a, b) => a.start - b.start)
  const current = day.find((s) => s.start <= now && s.end > now)
  const nextLive = day.find((s) => s.start > now && s.type === 'Live')
  const upNext = day.filter((s) => s.start > now).slice(0, 5)

  const clientName = (id) => clients.find((c) => c.id === id)?.name
  const live = bookings.filter((b) => b.status !== 'cancelled')
  const money = live.map((b) => ({ ...b, ...bookingMoney(b, payments) }))
  const received = money.reduce((s, b) => s + Math.min(b.paid, b.total), 0)
  const outstanding = money.reduce((s, b) => s + b.balance, 0)
  const overdue = money.filter((b) => b.status === 'overdue')
  const overdueSum = overdue.reduce((s, b) => s + b.balance, 0)
  const running = live.filter((b) => b.status === 'active' && b.start <= t && b.end >= t)
  const ending = running.filter((b) => b.end <= addDays(t, 7)).sort((a, b) => a.end.localeCompare(b.end))
  const collected = payments.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0)
  const spent = expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
  const onShift = attendance.filter((a) => a.date === t && !a.out)
  const latestLogs = [...logbook].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const last = monthSeries(state, Number(t.slice(0, 4))).filter((m) => m.month <= month).slice(-7)

  const stats = [
    canView('payments') && { label: 'Collected this month', value: rupees(collected), note: fmtMonthLong(month), to: '/payments' },
    canView('payments') && { label: 'Balance to collect', value: rupees(outstanding), note: `${overdue.length} overdue`, to: '/payments' },
    canView('expenses') && { label: 'Expenses this month', value: rupees(spent), note: fmtMonthLong(month), to: '/expenses' },
    canView('bookings') && { label: 'Ads running today', value: running.length, note: `${ending.length} end within 7 days`, to: '/bookings' },
  ].filter(Boolean)

  return (
    <>
      <PageHead title="Dashboard" sub={`${fmtDay(t)}. Welcome, ${user.name}.`}>
        {canManage('bookings') && <Button onClick={() => navigate('/bookings')}><Plus size={16} /> New booking</Button>}
        {canManage('schedule') && <Button variant="soft" onClick={() => navigate('/schedule')}>Edit timetable</Button>}
      </PageHead>

      <div className="stagger mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => <Stat key={s.label} {...s} hero={i === 0} />)}
      </div>

      <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-12">
        {canView('reports') && (
          <Card title="Revenue, last 7 months" className="md:col-span-2 xl:col-span-6"><RevenuePills months={last} /></Card>
        )}

        {canView('schedule') && (
          <Card title="On air now" className={canView('reports') ? 'xl:col-span-3' : 'xl:col-span-5'}>
            {current ? (
              <div className="flex h-full flex-col">
                <p className="text-2xl font-semibold leading-tight tracking-tight">{current.title}</p>
                <p className="mt-1.5 text-[13px] text-muted">Time: {time12(current.start)} to {time12(current.end % 1440)}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${((now - current.start) / (current.end - current.start)) * 100}%` }} />
                </div>
                <p className="tnum mt-1.5 text-xs text-muted">{duration(current.end - now)} left</p>
                {nextLive && <p className="mt-3 text-[13px] text-muted">Next live: <span className="font-medium text-text">{nextLive.title}</span>, {time12(nextLive.start)}</p>}
                <Button className="mt-4 w-full" onClick={() => navigate('/schedule')}><Radio size={16} /> Open timetable</Button>
              </div>
            ) : <Empty title="Nothing scheduled right now" />}
          </Card>
        )}

        {canView('schedule') && (
          <Card title="Up next" pad={false} className={canView('reports') ? 'xl:col-span-3' : 'xl:col-span-4'}
            action={<Link to="/schedule" className="rounded-full border border-ink/25 px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-ink hover:text-white">All</Link>}>
            {upNext.length === 0 ? <Empty title="No more programs today" /> : (
              <ul className="px-2">
                {upNext.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-paper">
                    <span className="tnum w-16 shrink-0 font-mono text-xs text-gold-deep">{time12(s.start)}</span>
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{s.title}</span><span className="text-xs text-muted">{s.type}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canView('attendance') && (
          <Card title="Staff at work" pad={false} className="xl:col-span-5"
            action={<Link to="/attendance" className="rounded-full border border-ink/25 px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-ink hover:text-white">All</Link>}>
            {onShift.length === 0 ? <Empty title="Nobody has started yet" /> : (
              <ul className="px-2">
                {onShift.map((a) => {
                  const who = users.find((u) => u.id === a.userId)
                  return (
                    <li key={a.id} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-paper">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-semibold text-gold-deep">{initials(who?.name ?? '?')}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{who?.name}</span><span className="text-xs text-muted">{who?.job}</span></span>
                      <Badge tone="good">Since {fmtStamp(a.in)}</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        )}

        {canView('payments') && (
          <Card title="Payment progress" className="xl:col-span-4">
            <Gauge parts={[
              { label: 'Received', value: received, stroke: '#161310', dot: 'bg-ink' },
              { label: 'Pending', value: outstanding - overdueSum, stroke: 'url(#gauge-hatch)', dot: 'hatch border border-line' },
              { label: 'Overdue', value: overdueSum, stroke: '#d9a928', dot: 'bg-gold' },
            ]} />
          </Card>
        )}

        <div className={canView('payments') || canView('attendance') ? 'grid xl:col-span-3' : 'grid xl:col-span-4'}><ShiftTimer /></div>

        {canView('bookings') && (
          <Card title="Ads ending soon" pad={false} className="xl:col-span-6">
            {ending.length === 0 ? <Empty title="None this week" /> : (
              <ul className="px-2">
                {ending.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-paper">
                    <span className="min-w-0"><span className="block truncate font-medium">{clientName(b.clientId)}</span><span className="text-xs text-muted">{b.packageName}</span></span>
                    <span className="shrink-0 text-xs text-muted">{fmtDate(b.end)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {canView('logbook') && (
          <Card title="Latest from the logbook" pad={false} className="xl:col-span-6"
            action={<Link to="/logbook" className="inline-flex items-center gap-1 text-[13px] text-gold-deep hover:underline">Open <ArrowRight size={13} /></Link>}>
            {latestLogs.length === 0 ? <Empty title="No entries yet" /> : (
              <ul className="px-2">
                {latestLogs.map((e) => (
                  <li key={e.id} className="rounded-xl px-3 py-2 text-sm transition-colors hover:bg-paper">
                    <span className="block truncate font-medium">{e.title}</span>
                    <span className="text-xs text-muted">{users.find((u) => u.id === e.userId)?.name} · {fmtDate(e.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  )
}
