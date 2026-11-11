import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { bookingMoney, bookingTotal, slotText, useStore } from '../store.jsx'
import { addDays, addMonths, fmtDate, rupees, today } from '../lib.js'
import { Badge, BillingBadge, Button, Card, Empty, Field, FormFoot, IconButton, Input, Modal, PageHead, PayBadge, Select, Table, Tabs, Textarea, form } from '../ui.jsx'

const endFor = (start, unit, qty) => {
  if (!start || !qty) return start
  if (unit === 'month') return addDays(addMonths(start, Number(qty)), -1)
  if (unit === 'day') return addDays(start, Number(qty) - 1)
  return start
}

function BookingForm({ booking, onClose }) {
  const { clients, packages, actions } = useStore()
  const sellable = packages.filter((p) => p.active || p.id === booking?.packageId)
  const first = sellable[0]
  const [f, setF] = useState(booking ?? {
    clientId: clients[0]?.id ?? '', packageId: first.id, billing: 'paid', agreedPrice: first.price, quantity: 1,
    start: today(), end: endFor(today(), first.unit, 1), due: addDays(today(), 7),
    mode: first.unit === 'month' ? 'interval' : 'times', times: [], interval: 30, from: '06:00', to: '22:00', status: 'active', notes: '',
  })
  const [slot, setSlot] = useState('')
  const [error, setError] = useState('')
  const pkg = packages.find((p) => p.id === f.packageId)
  const unit = booking && f.packageId === booking.packageId ? booking.unit : pkg.unit
  const listPrice = booking && f.packageId === booking.packageId ? booking.listPrice : pkg.price
  const patch = (p) => setF((cur) => ({ ...cur, ...p }))
  const set = (k) => (e) => patch({ [k]: e.target.value })

  const pickPackage = (id) => {
    const p = packages.find((x) => x.id === id)
    patch({ packageId: id, agreedPrice: p.price, end: endFor(f.start, p.unit, f.quantity) })
  }

  const custom = {
    agreedPrice: Number(f.agreedPrice) || 0, quantity: Number(f.quantity) || 0, billing: f.billing,
  }
  const total = bookingTotal(custom)
  const standard = listPrice * custom.quantity
  const diff = standard - total

  const addSlot = () => {
    if (slot && !f.times.includes(slot)) patch({ times: [...f.times, slot].sort() })
    setSlot('')
  }

  const save = () => {
    if (!f.clientId) return setError('Choose a client')
    if (custom.quantity <= 0) return setError('Enter how many')
    if (f.end < f.start) return setError('End date must be on or after the start date')
    if (f.mode === 'times' && !f.times.length) return setError('Add at least one fixed time')
    if (f.mode === 'interval' && f.to <= f.from) return setError('The to time must be after the from time')
    const item = {
      ...f, agreedPrice: f.billing === 'zero' ? 0 : custom.agreedPrice, quantity: custom.quantity,
      packageName: booking?.packageId === f.packageId ? booking.packageName : pkg.name, unit, listPrice, due: f.billing === 'zero' ? null : f.due,
    }
    if (booking) actions.update('bookings', booking.id, item)
    else {
      const client = clients.find((c) => c.id === f.clientId)
      actions.add('bookings', item, { module: 'bookings', title: `New ad booking: ${client.name}`, body: `${pkg.name} from ${fmtDate(f.start)}`, link: '/bookings' })
    }
    actions.flash('Ad booking saved')
    onClose()
  }

  return (
    <Modal title={booking ? 'Edit ad booking' : 'New ad booking'} onClose={onClose} wide>
      <form onSubmit={form(save)} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client">
            <Select value={f.clientId} onChange={set('clientId')}>{clients.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          </Field>
          <Field label="Package">
            <Select value={f.packageId} onChange={(e) => pickPackage(e.target.value)}>
              {sellable.map((p) => <option key={p.id} value={p.id}>{p.name} ({rupees(p.price)} per {p.unit})</option>)}
            </Select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-lg font-semibold">Price</legend>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            {[['paid', 'Paid client'], ['mutual', 'Mutual understanding'], ['zero', 'Zero payment']].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={f.billing === v} onClick={() => patch({ billing: v })}
                className={`h-10 rounded-xl border text-sm font-medium transition-colors ${f.billing === v ? 'border-ink bg-ink text-white' : 'border-line hover:bg-paper'}`}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={`Standard price per ${unit}`}><Input value={rupees(listPrice)} disabled /></Field>
            <Field label={`Custom price per ${unit} (₹)`}><Input type="number" min="0" value={f.billing === 'zero' ? 0 : f.agreedPrice} disabled={f.billing === 'zero'} onChange={set('agreedPrice')} /></Field>
            <Field label={`How many ${unit}s`}>
              <Input type="number" min="0.5" step="0.5" value={f.quantity} onChange={(e) => patch({ quantity: e.target.value, end: endFor(f.start, unit, e.target.value) })} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-paper px-3 py-2">
            <span className="text-sm text-muted">
              {diff > 0 ? `${rupees(diff)} below the standard price` : diff < 0 ? `${rupees(-diff)} above the standard price` : 'Same as the standard price'}
            </span>
            <span className="tnum font-display text-2xl font-bold">{rupees(total)}</span>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-lg font-semibold">Dates</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Starts"><Input type="date" required value={f.start} onChange={(e) => patch({ start: e.target.value, end: endFor(e.target.value, unit, f.quantity) })} /></Field>
            <Field label="Ends"><Input type="date" required value={f.end} onChange={set('end')} /></Field>
            {f.billing !== 'zero' && <Field label="Payment due"><Input type="date" value={f.due ?? ''} onChange={set('due')} /></Field>}
          </div>
        </fieldset>

        <fieldset>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <legend className="text-lg font-semibold">Air timing</legend>
            <Tabs value={f.mode} onChange={(mode) => patch({ mode })} options={[['interval', 'Repeating'], ['times', 'Fixed times']]} />
          </div>
          {f.mode === 'interval' ? (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Every (minutes)"><Input type="number" min="5" step="5" value={f.interval} onChange={set('interval')} /></Field>
              <Field label="From"><Input type="time" value={f.from} onChange={set('from')} /></Field>
              <Field label="To"><Input type="time" value={f.to} onChange={set('to')} /></Field>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input type="time" aria-label="Add a time" value={slot} onChange={(e) => setSlot(e.target.value)} className="max-w-36" />
                <Button variant="soft" onClick={addSlot}>Add time</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.times.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded bg-gold-soft pl-2 font-mono text-[13px] text-gold-deep">
                    {t}
                    <button type="button" aria-label={`Remove ${t}`} className="p-1" onClick={() => patch({ times: f.times.filter((x) => x !== t) })}><X size={13} /></button>
                  </span>
                ))}
              </div>
            </>
          )}
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={set('notes')} /></Field>
          {booking && (
            <Field label="Status">
              <Select value={f.status} onChange={set('status')}>
                <option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option>
              </Select>
            </Field>
          )}
        </div>
        <FormFoot onCancel={onClose} error={error} />
      </form>
    </Modal>
  )
}

const stateOf = (b, t) => {
  if (b.status !== 'active') return b.status
  if (b.start > t) return 'upcoming'
  return b.end < t ? 'ended' : 'running'
}
const STATE = { running: ['good', 'Running'], upcoming: ['info', 'Upcoming'], ended: ['plain', 'Ended'], paused: ['warn', 'Paused'], cancelled: ['plain', 'Cancelled'] }

export default function Bookings() {
  const { bookings, clients, payments, canManage, canView } = useStore()
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const manage = canManage('bookings')
  const showPay = canView('payments')
  const t = today()
  const shown = bookings.filter((b) => filter === 'all' || stateOf(b, t) === filter)

  return (
    <>
      <PageHead title="Ad bookings" sub="Which client took which package, at what price and at what time" viewOnly={!manage}>
        {manage && <Button onClick={() => setEditing('new')}><Plus size={16} /> New booking</Button>}
      </PageHead>
      <div className="mb-3 overflow-x-auto"><Tabs value={filter} onChange={setFilter} options={[['all', 'All'], ['running', 'Running'], ['upcoming', 'Upcoming'], ['ended', 'Ended']]} /></div>
      <Card pad={false}>
        {shown.length === 0 ? <Empty title="No bookings here" /> : (
          <Table minWidth={980} head={['Client and package', 'Period', 'Air timing', { label: 'Standard', right: true }, { label: 'Custom total', right: true }, 'Type', ...(showPay ? ['Payment'] : []), 'State', '']}>
            {shown.map((b) => {
              const m = bookingMoney(b, payments)
              const [tone, label] = STATE[stateOf(b, t)]
              return (
                <tr key={b.id}>
                  <td><span className="block font-medium">{clients.find((c) => c.id === b.clientId)?.name}</span><span className="text-[13px] text-muted">{b.packageName}</span></td>
                  <td className="whitespace-nowrap text-[13px]">{fmtDate(b.start)}<br /><span className="text-muted">to {fmtDate(b.end)}</span></td>
                  <td className="max-w-44 font-mono text-xs text-gold-deep">{slotText(b)}</td>
                  <td className="tnum text-right text-muted">{rupees(b.listPrice * b.quantity)}</td>
                  <td className="tnum text-right font-medium">{rupees(m.total)}</td>
                  <td><BillingBadge type={b.billing} /></td>
                  {showPay && <td><PayBadge status={m.status} /></td>}
                  <td><Badge tone={tone}>{label}</Badge></td>
                  <td>{manage && <Button variant="ghost" size="sm" onClick={() => setEditing(b)}>Edit</Button>}</td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>
      {editing && <BookingForm booking={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
