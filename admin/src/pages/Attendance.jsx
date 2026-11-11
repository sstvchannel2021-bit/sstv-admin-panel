import { useState } from 'react'
import { useStore } from '../store.jsx'
import { duration, fmtDate, fmtStamp, fmtStampFull, today } from '../lib.js'
import { Badge, Card, Empty, PageHead, Stat, Table, Tabs } from '../ui.jsx'

export default function Attendance() {
  const { attendance, logins, users, canManage } = useStore()
  const [tab, setTab] = useState('work')
  const name = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown'
  const t = today()
  const atWork = attendance.filter((a) => a.date === t && !a.out).length
  const staffCount = users.filter((u) => u.active && u.role === 'staff').length

  return (
    <>
      <PageHead title="Attendance" sub="When staff started and finished, and when they logged in and out" viewOnly={!canManage('attendance')} />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="At work now" value={atWork} note={`of ${staffCount} staff`} />
        <Stat label="Logins today" value={logins.filter((l) => new Date(l.in).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === t).length} />
      </div>
      <div className="mb-3"><Tabs value={tab} onChange={setTab} options={[['work', 'Work hours'], ['logins', 'Login and logout']]} /></div>
      <Card pad={false}>
        {tab === 'work' ? (
          attendance.length === 0 ? <Empty title="No attendance yet" /> : (
            <Table head={['Date', 'Staff', 'Started', 'Finished', 'Hours', '']}>
              {[...attendance].sort((a, b) => b.in.localeCompare(a.in)).map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap">{fmtDate(a.date)}</td>
                  <td className="font-medium">{name(a.userId)}</td>
                  <td className="tnum">{fmtStamp(a.in)}</td>
                  <td className="tnum">{a.out ? fmtStamp(a.out) : '—'}</td>
                  <td className="tnum">{a.out ? duration(Math.round((new Date(a.out) - new Date(a.in)) / 60000)) : '—'}</td>
                  <td>
                    {!a.out && a.date === t && <Badge tone="good">At work</Badge>}
                    {!a.out && a.date !== t && <Badge tone="bad">Did not finish</Badge>}
                  </td>
                </tr>
              ))}
            </Table>
          )
        ) : (
          <Table head={['Staff', 'Logged in', 'Logged out', 'Device']}>
            {[...logins].sort((a, b) => b.in.localeCompare(a.in)).map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{name(l.userId)}</td>
                <td className="tnum whitespace-nowrap">{fmtStampFull(l.in)}</td>
                <td className="tnum whitespace-nowrap">{l.out ? fmtStampFull(l.out) : <Badge tone="good">Logged in</Badge>}</td>
                <td className="text-muted">{l.device}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}
