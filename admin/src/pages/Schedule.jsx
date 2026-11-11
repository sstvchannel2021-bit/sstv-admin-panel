import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { slotText, useStore } from '../store.jsx'
import { PROGRAM_TYPES } from '../data.js'
import { addDays, duration, fmtDay, nowMinutes, time12, toMin, toTime, today } from '../lib.js'
import { Badge, Button, Card, Empty, Field, FormFoot, IconButton, Input, Modal, PageHead, Select, Textarea, form } from '../ui.jsx'

const TYPE_BAR = {
  News: 'bg-air', Live: 'bg-gold', Recorded: 'bg-info', Devotional: 'bg-good', Entertainment: 'bg-[#7b6a4f]',
  Sponsored: 'bg-gold-deep', Repeat: 'bg-line', Other: 'bg-muted',
}

const endText = (m) => (m === 1440 ? '24:00' : toTime(m))

function ProgramForm({ date, item, day, onClose }) {
  const { actions, bookings, clients } = useStore()
  const [f, setF] = useState({
    title: item?.title ?? '', type: item?.type ?? 'Recorded', presenter: item?.presenter ?? '', notes: item?.notes ?? '',
    start: toTime(item?.start ?? 0), end: endText(item?.end ?? 60), sponsor: item?.sponsor ?? '',
  })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const sponsors = bookings.filter((b) => b.status === 'active' && b.start <= date && b.end >= date)

  const save = () => {
    const start = toMin(f.start)
    const end = toMin(f.end)
    if (!f.title.trim()) return setError('Enter the program name')
    if (end <= start) return setError('End time must be after start time. A program past midnight ends at 24:00 and continues on the next day.')
    const clash = day.find((s) => s.id !== item?.id && s.start < end && s.end > start)
    if (clash) return setError(`This overlaps ${clash.title} (${toTime(clash.start)} to ${endText(clash.end)})`)
    actions.saveProgram(date, { ...(item?.id && { id: item.id }), ...f, title: f.title.trim(), start, end }, {
      module: 'schedule', title: `Timetable ${item?.id ? 'changed' : 'added'}: ${f.title.trim()}`, body: `${date} at ${f.start}`, link: `/schedule?date=${date}`,
    })
    actions.flash('Timetable saved')
    onClose()
  }

  return (
    <Modal title={item?.id ? 'Edit program' : 'Add program'} onClose={onClose}>
      <form onSubmit={form(save)} className="space-y-3">
        <Field label="Program name"><Input autoFocus value={f.title} onChange={set('title')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start"><Input value={f.start} onChange={set('start')} type="time" required /></Field>
          <Field label="End" hint="Use 24:00 for midnight"><Input value={f.end} onChange={set('end')} pattern="([01]\d|2[0-3]):[0-5]\d|24:00" placeholder="09:30" required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={f.type} onChange={set('type')}>{PROGRAM_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Presenter"><Input value={f.presenter} onChange={set('presenter')} /></Field>
        </div>
        <Field label="Sponsor">
          <Select value={f.sponsor} onChange={set('sponsor')}>
            <option value="">None</option>
            {sponsors.map((b) => <option key={b.id} value={b.id}>{clients.find((c) => c.id === b.clientId)?.name}, {b.packageName}</option>)}
          </Select>
        </Field>
        <Field label="Notes"><Textarea value={f.notes} onChange={set('notes')} /></Field>
        <FormFoot onCancel={onClose} error={error} />
      </form>
    </Modal>
  )
}

function CopyForm({ date, onClose }) {
  const { actions } = useStore()
  const [from, setFrom] = useState(addDays(date, 1))
  const [to, setTo] = useState(addDays(date, 7))
  const [error, setError] = useState('')
  const save = () => {
    if (to < from) return setError('Last date must be on or after the first date')
    const dates = []
    for (let d = from; d <= to; d = addDays(d, 1)) if (d !== date) dates.push(d)
    actions.copyDay(date, dates)
    actions.flash(`Copied to ${dates.length} ${dates.length === 1 ? 'day' : 'days'}`)
    onClose()
  }
  return (
    <Modal title="Copy this day" onClose={onClose}>
      <form onSubmit={form(save)} className="space-y-3">
        <p className="text-sm text-muted">Copy {fmtDay(date)} to other days. Anything already on those days is replaced.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First date"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required /></Field>
          <Field label="Last date"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
        </div>
        <FormFoot onCancel={onClose} label="Copy day" error={error} />
      </form>
    </Modal>
  )
}

function Lookup({ schedule }) {
  const [date, setDate] = useState(addDays(today(), 1))
  const [time, setTime] = useState('08:30')
  const answer = (schedule[date] ?? []).find((s) => time && s.start <= toMin(time) && s.end > toMin(time))
  return (
    <section className="hero-ink rounded-2xl p-4 text-white">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Search size={16} className="text-gold" /> What is on at…</h2>
      <div className="mt-2.5 grid grid-cols-[1fr_6.5rem] gap-2 [&_input]:border-white/15 [&_input]:bg-ink-2 [&_input]:text-white [&_input]:[color-scheme:dark]">
        <Input type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="mt-3 border-t border-white/10 pt-3">
        {answer ? (
          <>
            <p className="text-2xl font-semibold text-gold">{answer.title}</p>
            <p className="text-[13px] text-white/60">{answer.type} · {time12(answer.start)} to {time12(answer.end % 1440)}</p>
          </>
        ) : <p className="text-sm text-white/60">Nothing is scheduled at that time.</p>}
      </div>
    </section>
  )
}

export default function Schedule() {
  const store = useStore()
  const { schedule, canManage, bookings, clients, actions } = store
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? today()
  const setDate = (d) => setParams({ date: d })
  const [editing, setEditing] = useState(null)
  const [copying, setCopying] = useState(false)
  const manage = canManage('schedule')

  const day = useMemo(() => [...(schedule[date] ?? [])].sort((a, b) => a.start - b.start), [schedule, date])
  const rows = useMemo(() => {
    const out = []
    let at = 0
    for (const s of day) {
      if (s.start > at) out.push({ gap: true, start: at, end: s.start })
      out.push(s)
      at = Math.max(at, s.end)
    }
    if (at < 1440) out.push({ gap: true, start: at, end: 1440 })
    return out
  }, [day])

  const missing = rows.filter((r) => r.gap).reduce((s, r) => s + r.end - r.start, 0)
  const ads = bookings.filter((b) => b.status === 'active' && b.start <= date && b.end >= date)
  const isToday = date === today()
  const now = nowMinutes()
  const week = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3))

  return (
    <>
      <PageHead title="Timetable" sub="The full 24 hours of every day on the channel" viewOnly={!manage}>
        {manage && <Button variant="soft" onClick={() => setCopying(true)}><Copy size={15} /> Copy day</Button>}
        {manage && <Button onClick={() => setEditing({})}><Plus size={16} /> Add program</Button>}
      </PageHead>

      <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-2xl bg-card p-1.5">
        <IconButton label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={18} /></IconButton>
        <div className="grid min-w-[280px] flex-1 grid-cols-7 gap-1">
          {week.map((d) => {
            const dt = new Date(`${d}T00:00:00Z`)
            const on = d === date
            return (
              <button key={d} type="button" onClick={() => setDate(d)} aria-pressed={on}
                className={`rounded-xl py-1.5 text-center transition-colors ${on ? 'bg-ink text-white' : 'hover:bg-paper'}`}>
                <span className={`block text-[11px] ${on ? 'text-gold' : 'text-muted'}`}>{d === today() ? 'Today' : dt.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })}</span>
                <span className="tnum block font-display text-xl font-semibold leading-tight">{dt.getUTCDate()}</span>
              </button>
            )
          })}
        </div>
        <IconButton label="Next day" onClick={() => setDate(addDays(date, 1))}><ChevronRight size={18} /></IconButton>
        <Input type="date" aria-label="Pick a date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="hidden w-40 md:block" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <Card pad={false}
          title={fmtDay(date)}
          action={missing ? <Badge tone="warn">{duration(missing)} not scheduled</Badge> : <Badge tone="good">24 hours covered</Badge>}>
          {!day.length && <Empty title="Nothing scheduled for this day">{manage ? 'Add a program or copy another day onto it.' : 'The team has not added this day yet.'}</Empty>}
          {day.length > 0 && (
            <ol className="divide-y divide-line">
              {rows.map((r) => {
                if (r.gap) {
                  return (
                    <li key={`gap-${r.start}`} className="flex items-center gap-3 bg-warn-soft/40 px-4 py-2 text-[13px] text-warn">
                      <span className="tnum w-[6.6rem] shrink-0 font-mono">{toTime(r.start)}–{endText(r.end)}</span>
                      <span>Not scheduled, {duration(r.end - r.start)}</span>
                      {manage && <button type="button" className="ml-auto font-medium underline" onClick={() => setEditing({ start: r.start, end: r.end })}>Fill</button>}
                    </li>
                  )
                }
                const onAir = isToday && r.start <= now && r.end > now
                const sponsor = bookings.find((b) => b.id === r.sponsor)
                return (
                  <li key={r.id} className={`group flex items-stretch gap-3 px-4 py-2.5 ${onAir ? 'bg-gold-soft/60' : ''}`}>
                    <span className="tnum w-[6.6rem] shrink-0 pt-0.5 font-mono text-[13px]">
                      <span className="font-medium">{toTime(r.start)}</span><span className="text-muted">–{endText(r.end)}</span>
                    </span>
                    <span className={`w-1 shrink-0 rounded ${TYPE_BAR[r.type]}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.title}</span>
                        {onAir && <span className="rounded bg-air px-1.5 text-[10px] font-bold leading-4 tracking-wider text-white">ON AIR</span>}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {[r.type, duration(r.end - r.start), r.presenter, sponsor && `Sponsor: ${clients.find((c) => c.id === sponsor.clientId)?.name}`].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    {manage && (
                      <span className="flex shrink-0 items-center opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                        <IconButton label={`Edit ${r.title}`} onClick={() => setEditing(r)}><Pencil size={15} /></IconButton>
                        <IconButton label={`Delete ${r.title}`} onClick={() => {
                          actions.removeProgram(date, r.id, { module: 'schedule', title: `Timetable removed: ${r.title}`, body: `${date} at ${toTime(r.start)}`, link: `/schedule?date=${date}` })
                          actions.flash('Program removed')
                        }}><Trash2 size={15} /></IconButton>
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>

        <div className="space-y-4 lg:sticky lg:top-0">
          <Lookup schedule={schedule} />
          <Card title={`Ads running (${ads.length})`} pad={false}>
            {ads.length === 0 ? <Empty title="No ads on this day" /> : (
              <ul className="divide-y divide-line">
                {ads.map((b) => (
                  <li key={b.id} className="px-4 py-2.5 text-sm">
                    <span className="block font-medium">{clients.find((c) => c.id === b.clientId)?.name}</span>
                    <span className="block text-[13px] text-muted">{b.packageName}</span>
                    <span className="tnum block font-mono text-xs text-gold-deep">{slotText(b)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {editing && <ProgramForm date={date} item={editing} day={day} onClose={() => setEditing(null)} />}
      {copying && <CopyForm date={date} onClose={() => setCopying(false)} />}
    </>
  )
}
