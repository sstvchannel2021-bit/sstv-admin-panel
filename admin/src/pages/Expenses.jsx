import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { EXPENSE_CATEGORIES, PAY_METHODS } from '../data.js'
import { fmtDate, fmtMonthLong, rupees, today } from '../lib.js'
import { Button, Card, Empty, Field, FormFoot, IconButton, Input, Modal, PageHead, Select, Stat, Table, form } from '../ui.jsx'

function ExpenseForm({ onClose }) {
  const { actions } = useStore()
  const [f, setF] = useState({ title: '', category: 'Office', amount: '', vendor: '', method: 'Cash', date: today(), notes: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    const amount = Number(f.amount)
    if (!f.title.trim()) return setError('Enter what the expense was for')
    if (!amount || amount <= 0) return setError('Enter the amount')
    actions.add('expenses', { ...f, amount }, { module: 'expenses', title: `Expense added: ${f.title}`, body: `${rupees(amount)} under ${f.category}`, link: '/expenses' })
    actions.flash('Expense saved')
    onClose()
  }
  return (
    <Modal title="Add expense" onClose={onClose}>
      <form onSubmit={form(save)} className="space-y-3">
        <Field label="What was it for"><Input autoFocus value={f.title} onChange={set('title')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)"><Input type="number" min="1" value={f.amount} onChange={set('amount')} /></Field>
          <Field label="Date"><Input type="date" required value={f.date} onChange={set('date')} /></Field>
          <Field label="Category"><Select value={f.category} onChange={set('category')}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Paid by"><Select value={f.method} onChange={set('method')}>{PAY_METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
        </div>
        <Field label="Paid to"><Input value={f.vendor} onChange={set('vendor')} /></Field>
        <FormFoot onCancel={onClose} error={error} />
      </form>
    </Modal>
  )
}

export default function Expenses() {
  const { expenses, canManage, actions } = useStore()
  const [month, setMonth] = useState(today().slice(0, 7))
  const [adding, setAdding] = useState(false)
  const manage = canManage('expenses')
  const list = expenses.filter((e) => e.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date))
  const total = list.reduce((s, e) => s + e.amount, 0)
  const byCat = Object.entries(list.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {})).sort((a, b) => b[1] - a[1])

  return (
    <>
      <PageHead title="Expenses" sub={fmtMonthLong(month)} viewOnly={!manage}>
        <Input type="month" aria-label="Month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="w-44" />
        {manage && <Button onClick={() => setAdding(true)}><Plus size={16} /> Add expense</Button>}
      </PageHead>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
        <Card pad={false}>
          {list.length === 0 ? <Empty title="No expenses this month" /> : (
            <Table head={['Date', 'Expense', 'Category', 'Paid by', { label: 'Amount', right: true }, ...(manage ? [''] : [])]}>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td><span className="block font-medium">{e.title}</span><span className="text-[13px] text-muted">{e.vendor}</span></td>
                  <td>{e.category}</td>
                  <td>{e.method}</td>
                  <td className="tnum text-right font-medium">{rupees(e.amount)}</td>
                  {manage && <td className="text-right"><IconButton label={`Delete ${e.title}`} onClick={() => { actions.remove('expenses', e.id); actions.flash('Expense removed') }}><Trash2 size={15} /></IconButton></td>}
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <div className="space-y-4">
          <Stat label="Total this month" value={rupees(total)} />
          {byCat.length > 0 && (
            <Card title="By category">
              <ul className="space-y-2.5">
                {byCat.map(([c, v]) => (
                  <li key={c} className="text-sm">
                    <div className="flex justify-between"><span>{c}</span><span className="tnum">{rupees(v)}</span></div>
                    <div className="mt-1 h-1.5 rounded bg-paper"><div className="h-full rounded bg-gold-deep" style={{ width: `${(v / byCat[0][1]) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
      {adding && <ExpenseForm onClose={() => setAdding(false)} />}
    </>
  )
}
