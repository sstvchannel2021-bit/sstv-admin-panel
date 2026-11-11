import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { bookingMoney, slotText, useStore } from '../store.jsx'
import { fmtDate, rupees } from '../lib.js'
import { BillingBadge, Badge, Button, Card, Empty, Field, FormFoot, Input, Modal, PageHead, PayBadge, Table, Textarea, form } from '../ui.jsx'

function ClientForm({ client, onClose }) {
  const { actions } = useStore()
  const [f, setF] = useState(client ?? { name: '', business: '', phone: '', email: '', address: '', gstin: '', notes: '', active: true })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name.trim()) return setError('Enter the client name')
    client ? actions.update('clients', client.id, f) : actions.add('clients', f)
    actions.flash('Client saved')
    onClose()
  }
  return (
    <Modal title={client ? 'Edit client' : 'Add client'} onClose={onClose} wide>
      <form onSubmit={form(save)} className="grid gap-3 sm:grid-cols-2">
        <Field label="Client name"><Input autoFocus value={f.name} onChange={set('name')} /></Field>
        <Field label="Business type"><Input value={f.business} onChange={set('business')} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Email"><Input value={f.email} onChange={set('email')} type="email" /></Field>
        <Field label="GSTIN"><Input value={f.gstin} onChange={set('gstin')} /></Field>
        <Field label="Address"><Input value={f.address} onChange={set('address')} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea value={f.notes} onChange={set('notes')} /></Field>
        <div className="sm:col-span-2"><FormFoot onCancel={onClose} error={error} /></div>
      </form>
    </Modal>
  )
}

function ClientDetail({ client, onClose, onEdit }) {
  const { bookings, payments, canView, canManage } = useStore()
  const showMoney = canView('payments')
  const list = bookings.filter((b) => b.clientId === client.id)
  const sums = list.filter((b) => b.status !== 'cancelled').map((b) => bookingMoney(b, payments))
  return (
    <Modal title={client.name} onClose={onClose} wide>
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{[client.business, client.address].filter(Boolean).join(' · ')}</p>
        {canManage('clients') && <Button variant="soft" size="sm" onClick={onEdit}>Edit</Button>}
      </div>
      {showMoney && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
          {[['Total value', sums.reduce((s, x) => s + x.total, 0)], ['Received', sums.reduce((s, x) => s + x.paid, 0)], ['Balance', sums.reduce((s, x) => s + x.balance, 0)]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-paper px-3 py-2"><p className="text-xs text-muted">{l}</p><p className="tnum font-display text-xl font-semibold">{rupees(v)}</p></div>
          ))}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold">Packages taken</h3>
      {list.length === 0 ? <p className="text-sm text-muted">No packages yet.</p> : (
        <ul className="space-y-2">
          {list.map((b) => {
            const m = bookingMoney(b, payments)
            return (
              <li key={b.id} className="rounded-xl border border-line p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{b.packageName}</span>
                  <span className="flex gap-1.5"><BillingBadge type={b.billing} />{showMoney && <PayBadge status={m.status} />}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">{fmtDate(b.start)} to {fmtDate(b.end)}</p>
                <p className="tnum font-mono text-xs text-gold-deep">{slotText(b)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

export default function Clients() {
  const { clients, bookings, payments, canManage, canView } = useStore()
  const [q, setQ] = useState('')
  const [form_, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const manage = canManage('clients')
  const showMoney = canView('payments')
  const shown = clients.filter((c) => `${c.name} ${c.business}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHead title="Clients" sub="Everyone who advertises on the channel" viewOnly={!manage}>
        {manage && <Button onClick={() => setForm('new')}><Plus size={16} /> Add client</Button>}
      </PageHead>
      <Card pad={false}>
        <div className="border-b border-line p-3">
          <div className="relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input aria-label="Search clients" placeholder="Search clients" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {shown.length === 0 ? <Empty title="No clients found" /> : (
          <Table head={['Client', 'Business', 'Running ads', ...(showMoney ? [{ label: 'Total value', right: true }, { label: 'Balance', right: true }] : []), 'Status']}>
            {shown.map((c) => {
              const list = bookings.filter((b) => b.clientId === c.id && b.status !== 'cancelled')
              const sums = list.map((b) => bookingMoney(b, payments))
              const balance = sums.reduce((s, x) => s + x.balance, 0)
              return (
                <tr key={c.id} className="cursor-pointer hover:bg-paper/70" onClick={() => setDetail(c.id)}>
                  <td><button type="button" className="text-left font-medium hover:underline">{c.name}</button></td>
                  <td className="text-muted">{c.business}</td>
                  <td className="tnum">{list.length}</td>
                  {showMoney && <td className="tnum text-right">{rupees(sums.reduce((s, x) => s + x.total, 0))}</td>}
                  {showMoney && <td className={`tnum text-right ${balance ? 'font-medium text-air' : 'text-muted'}`}>{rupees(balance)}</td>}
                  <td><Badge tone={c.active ? 'good' : 'plain'}>{c.active ? 'Active' : 'Inactive'}</Badge></td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>
      {form_ && <ClientForm client={form_ === 'new' ? null : form_} onClose={() => setForm(null)} />}
      {detail && <ClientDetail client={clients.find((c) => c.id === detail)} onClose={() => setDetail(null)} onEdit={() => { setForm(clients.find((c) => c.id === detail)); setDetail(null) }} />}
    </>
  )
}
