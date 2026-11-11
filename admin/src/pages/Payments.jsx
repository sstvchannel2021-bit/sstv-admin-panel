import { useState } from 'react'
import { bookingMoney, useStore } from '../store.jsx'
import { PAY_METHODS } from '../data.js'
import { fmtDate, rupees, today } from '../lib.js'
import { Button, Card, Empty, Field, FormFoot, Input, Modal, PageHead, PayBadge, Select, Stat, Table, Tabs, form } from '../ui.jsx'

function PayForm({ row, onClose }) {
  const { actions } = useStore()
  const [f, setF] = useState({ amount: row.balance, date: today(), method: 'UPI', reference: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    const amount = Number(f.amount)
    if (!amount || amount <= 0) return setError('Enter the amount')
    if (amount > row.balance) return setError(`The balance is only ${rupees(row.balance)}`)
    actions.add('payments', { bookingId: row.id, ...f, amount }, {
      module: 'payments', title: `Payment received: ${row.client}`, body: `${rupees(amount)} for ${row.packageName}`, link: '/payments',
    })
    actions.flash('Payment recorded')
    onClose()
  }
  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={form(save)} className="space-y-3">
        <p className="text-sm text-muted">{row.client}, {row.packageName}. Balance {rupees(row.balance)}.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)"><Input autoFocus type="number" min="1" value={f.amount} onChange={set('amount')} /></Field>
          <Field label="Date"><Input type="date" required value={f.date} onChange={set('date')} /></Field>
          <Field label="Method"><Select value={f.method} onChange={set('method')}>{PAY_METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
          <Field label="Reference"><Input value={f.reference} onChange={set('reference')} /></Field>
        </div>
        <FormFoot onCancel={onClose} error={error} label="Save payment" />
      </form>
    </Modal>
  )
}

export default function Payments() {
  const { bookings, payments, clients, canManage } = useStore()
  const [tab, setTab] = useState('due')
  const [paying, setPaying] = useState(null)
  const manage = canManage('payments')
  const client = (id) => clients.find((c) => c.id === id)?.name
  const rows = bookings.filter((b) => b.status !== 'cancelled' && bookingMoney(b, payments).total > 0)
    .map((b) => ({ ...b, client: client(b.clientId), ...bookingMoney(b, payments) }))
  const due = rows.filter((r) => r.balance > 0).sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9'))
  const month = today().slice(0, 7)

  return (
    <>
      <PageHead title="Payments" sub="Who has paid and who has not" viewOnly={!manage} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Balance to collect" value={rupees(due.reduce((s, r) => s + r.balance, 0))} tone="bad" />
        <Stat label="Overdue" value={rows.filter((r) => r.status === 'overdue').length} note="bookings" />
        <Stat label="Received this month" value={rupees(payments.filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0))} tone="good" />
      </div>
      <div className="mb-3"><Tabs value={tab} onChange={setTab} options={[['due', 'To collect'], ['all', 'All bookings'], ['history', 'Received']]} /></div>
      <Card pad={false}>
        {tab === 'history' ? (
          payments.length === 0 ? <Empty title="No payments yet" /> : (
            <Table head={['Date', 'Client', 'Package', 'Method', { label: 'Amount', right: true }]}>
              {[...payments].sort((a, b) => b.date.localeCompare(a.date)).map((p) => {
                const b = bookings.find((x) => x.id === p.bookingId)
                return (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{fmtDate(p.date)}</td>
                    <td className="font-medium">{client(b?.clientId)}</td>
                    <td className="text-muted">{b?.packageName}</td>
                    <td>{p.method}</td>
                    <td className="tnum text-right font-medium">{rupees(p.amount)}</td>
                  </tr>
                )
              })}
            </Table>
          )
        ) : (tab === 'due' ? due : rows).length === 0 ? <Empty title="Everything is paid" /> : (
          <Table minWidth={760} head={['Client and package', 'Due', { label: 'Total', right: true }, { label: 'Received', right: true }, { label: 'Balance', right: true }, 'Status', '']}>
            {(tab === 'due' ? due : rows).map((r) => (
              <tr key={r.id}>
                <td><span className="block font-medium">{r.client}</span><span className="text-[13px] text-muted">{r.packageName}</span></td>
                <td className="whitespace-nowrap">{fmtDate(r.due)}</td>
                <td className="tnum text-right">{rupees(r.total)}</td>
                <td className="tnum text-right">{rupees(r.paid)}</td>
                <td className="tnum text-right font-medium">{rupees(r.balance)}</td>
                <td><PayBadge status={r.status} /></td>
                <td className="text-right">{manage && r.balance > 0 && <Button variant="soft" size="sm" onClick={() => setPaying(r)}>Record payment</Button>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {paying && <PayForm row={paying} onClose={() => setPaying(null)} />}
    </>
  )
}
