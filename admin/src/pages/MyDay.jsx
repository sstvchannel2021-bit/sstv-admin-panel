import { Play, Square } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { duration, fmtDate, fmtDay, fmtStamp, today } from '../lib.js'
import { Button, Card, Empty, PageHead, Table } from '../ui.jsx'

export default function MyDay() {
  const { attendance, user, actions } = useStore()
  const t = today()
  const mine = attendance.filter((a) => a.userId === user.id)
  const open = mine.find((a) => a.date === t && !a.out)

  return (
    <>
      <PageHead title="My day" sub={fmtDay(t)} />
      <section className="mb-4 hero-ink flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-white sm:p-6">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-white/60">{open ? 'YOU ARE AT WORK' : 'NOT STARTED'}</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-wide sm:text-4xl">
            {open ? `Started at ${fmtStamp(open.in)}` : 'Press start when you arrive'}
          </p>
        </div>
        {open ? (
          <Button variant="soft" className="h-12 px-5" onClick={() => { actions.clockOut(); actions.flash('Finish time saved') }}><Square size={16} /> Finish work</Button>
        ) : (
          <Button variant="gold" className="h-12 px-5" onClick={() => { actions.clockIn(); actions.flash('Start time saved') }}><Play size={16} /> Start work</Button>
        )}
      </section>
      <Card title="My recent attendance" pad={false} action={<Link to="/logbook" className="text-[13px] text-gold-deep hover:underline">Write in logbook</Link>}>
        {mine.length === 0 ? <Empty title="No attendance yet">Your start and finish times will show here.</Empty> : (
          <Table head={['Date', 'Started', 'Finished', 'Hours']} minWidth={420}>
            {mine.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.date)}</td>
                <td className="tnum">{fmtStamp(a.in)}</td>
                <td className="tnum">{a.out ? fmtStamp(a.out) : <span className="text-muted">Not finished</span>}</td>
                <td className="tnum">{a.out ? duration(Math.round((new Date(a.out) - new Date(a.in)) / 60000)) : '—'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}
