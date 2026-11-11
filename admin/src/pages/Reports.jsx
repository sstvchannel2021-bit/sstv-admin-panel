import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { bookingTotal, monthSeries, useStore } from '../store.jsx'
import { downloadCsv, fmtMonth, fmtMonthLong, rupees, today } from '../lib.js'
import { Button, Card, Empty, PageHead, Select, Stat, Table } from '../ui.jsx'

const SERIES = [['collected', 'Collected', '#1668a8'], ['expenses', 'Expenses', '#d9a928']]

function Bars({ months, selected, onPick }) {
  const max = Math.max(...months.flatMap((m) => [m.collected, m.expenses]), 1)
  const [hover, setHover] = useState(null)
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-[13px] text-muted">
        {SERIES.map(([, label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: color }} /> {label}</span>
        ))}
      </div>
      <div className="relative">
        <div className="flex h-56 items-end gap-1 border-b border-line sm:gap-2" role="img" aria-label="Collected and expenses by month. The same figures are in the table below.">
          {months.map((m, i) => (
            <button
              key={m.month} type="button" aria-label={`Show ${fmtMonthLong(m.month)}`}
              onClick={() => onPick(m.month)}
              onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(m)} onBlur={() => setHover(null)}
              className={`flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-t px-0.5 ${m.month === selected ? 'bg-gold-soft/70' : 'hover:bg-paper'}`}
            >
              {SERIES.map(([k, , color]) => (
                <span key={k} className="grow-bar w-full max-w-4 rounded-full" style={{ height: `${(m[k] / max) * 94}%`, background: color, animationDelay: `${i * 40}ms` }} />
              ))}
            </button>
          ))}
        </div>
        {hover && (
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-[13px] text-white shadow-lg">
            <p className="font-medium">{fmtMonthLong(hover.month)}</p>
            <p className="tnum text-white/75">Collected {rupees(hover.collected)}</p>
            <p className="tnum text-white/75">Expenses {rupees(hover.expenses)}</p>
          </div>
        )}
      </div>
      <div className="mt-1 flex gap-1 sm:gap-2">
        {months.map((m) => <span key={m.month} className="min-w-0 flex-1 text-center text-[11px] text-muted">{fmtMonth(m.month)}</span>)}
      </div>
    </div>
  )
}

export default function Reports() {
  const { bookings, payments, expenses, clients } = useStore()
  const t = today()
  const thisYear = Number(t.slice(0, 4))
  const [year, setYear] = useState(thisYear)
  const [selected, setSelected] = useState(t.slice(0, 7))

  const months = useMemo(() => monthSeries({ bookings, payments, expenses }, year), [bookings, payments, expenses, year])

  const sum = (k) => months.reduce((s, m) => s + m[k], 0)
  const inMonth = bookings.filter((b) => b.status !== 'cancelled' && b.start.startsWith(selected))
  const byPackage = Object.values(inMonth.reduce((acc, b) => {
    const row = acc[b.packageName] ?? { name: b.packageName, count: 0, standard: 0, total: 0 }
    return { ...acc, [b.packageName]: { ...row, count: row.count + 1, standard: row.standard + b.listPrice * b.quantity, total: row.total + bookingTotal(b) } }
  }, {})).sort((a, b) => b.total - a.total)
  const free = bookings.filter((b) => b.status !== 'cancelled' && b.billing !== 'paid' && b.start.startsWith(selected))
  const byExpense = Object.entries(expenses.filter((e) => e.date.startsWith(selected))
    .reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {})).sort((a, b) => b[1] - a[1])

  const exportCsv = () => downloadCsv(`ss-tv-report-${year}.csv`, [
    ['Month', 'Booked', 'Collected', 'Expenses', 'Profit'],
    ...months.map((m) => [fmtMonthLong(m.month), m.booked, m.collected, m.expenses, m.profit]),
    ['Total', sum('booked'), sum('collected'), sum('expenses'), sum('profit')],
  ])

  return (
    <>
      <PageHead title="Reports" sub="Monthly and annual revenue, expenses and profit">
        <Select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
          {[thisYear, thisYear - 1].map((y) => <option key={y}>{y}</option>)}
        </Select>
        <Button variant="soft" onClick={exportCsv}><Download size={15} /> Export</Button>
      </PageHead>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Booked in ${year}`} value={rupees(sum('booked'))} note="Value of deals signed" />
        <Stat label="Collected" value={rupees(sum('collected'))} note="Money actually received" />
        <Stat label="Expenses" value={rupees(sum('expenses'))} />
        <Stat label="Profit" value={rupees(sum('profit'))} tone={sum('profit') >= 0 ? 'good' : 'bad'} note="Collected minus expenses" />
      </div>

      <Card title={`${year} by month`} className="mb-4"><Bars months={months} selected={selected} onPick={setSelected} /></Card>

      <Card title="Monthly figures" pad={false} className="mb-4">
        <Table minWidth={560} head={['Month', { label: 'Booked', right: true }, { label: 'Collected', right: true }, { label: 'Expenses', right: true }, { label: 'Profit', right: true }]}>
          {months.map((m) => (
            <tr key={m.month} onClick={() => setSelected(m.month)} className={`cursor-pointer ${m.month === selected ? 'bg-gold-soft/50' : 'hover:bg-paper/70'}`}>
              <td className="font-medium">{fmtMonthLong(m.month)}</td>
              <td className="tnum text-right">{rupees(m.booked)}</td>
              <td className="tnum text-right">{rupees(m.collected)}</td>
              <td className="tnum text-right">{rupees(m.expenses)}</td>
              <td className={`tnum text-right font-medium ${m.profit < 0 ? 'text-air' : ''}`}>{rupees(m.profit)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <h2 className="mb-2 text-2xl font-semibold">{fmtMonthLong(selected)} in detail</h2>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title="Revenue by package" pad={false}>
          {byPackage.length === 0 ? <Empty title="No packages started this month" /> : (
            <Table minWidth={420} head={['Package', { label: 'Deals', right: true }, { label: 'Standard', right: true }, { label: 'Actual', right: true }]}>
              {byPackage.map((p) => (
                <tr key={p.name}><td className="font-medium">{p.name}</td><td className="tnum text-right">{p.count}</td><td className="tnum text-right text-muted">{rupees(p.standard)}</td><td className="tnum text-right font-medium">{rupees(p.total)}</td></tr>
              ))}
            </Table>
          )}
        </Card>
        <Card title="Expenses by category" pad={false}>
          {byExpense.length === 0 ? <Empty title="No expenses recorded in detail for this month" /> : (
            <Table minWidth={280} head={['Category', { label: 'Amount', right: true }]}>
              {byExpense.map(([c, v]) => <tr key={c}><td className="font-medium">{c}</td><td className="tnum text-right">{rupees(v)}</td></tr>)}
            </Table>
          )}
        </Card>
        <Card title="Mutual understanding and zero payment" pad={false} className="lg:col-span-2">
          {free.length === 0 ? <Empty title="None started this month" /> : (
            <Table minWidth={520} head={['Client', 'Package', 'Type', { label: 'Standard value', right: true }, { label: 'Charged', right: true }]}>
              {free.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium">{clients.find((c) => c.id === b.clientId)?.name}</td>
                  <td>{b.packageName}</td>
                  <td>{b.billing === 'zero' ? 'Zero payment' : 'Mutual understanding'}</td>
                  <td className="tnum text-right text-muted">{rupees(b.listPrice * b.quantity)}</td>
                  <td className="tnum text-right font-medium">{rupees(bookingTotal(b))}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  )
}
