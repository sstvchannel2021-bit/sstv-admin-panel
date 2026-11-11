import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { LOG_CATEGORIES } from '../data.js'
import { fmtDate, initials, today } from '../lib.js'
import { Badge, Button, Card, Empty, Field, FormFoot, IconButton, Input, Modal, PageHead, Select, Textarea, form } from '../ui.jsx'

function EntryForm({ onClose }) {
  const { actions, user } = useStore()
  const [f, setF] = useState({ title: '', category: 'Shift note', details: '', date: today() })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.title.trim()) return setError('Enter a short title')
    actions.add('logbook', { ...f, userId: user.id })
    actions.flash('Logbook entry saved')
    onClose()
  }
  return (
    <Modal title="New logbook entry" onClose={onClose}>
      <form onSubmit={form(save)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" required value={f.date} onChange={set('date')} /></Field>
          <Field label="Category"><Select value={f.category} onChange={set('category')}>{LOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        </div>
        <Field label="Title"><Input autoFocus value={f.title} onChange={set('title')} /></Field>
        <Field label="What happened"><Textarea rows={4} value={f.details} onChange={set('details')} /></Field>
        <FormFoot onCancel={onClose} error={error} />
      </form>
    </Modal>
  )
}

export default function Logbook() {
  const { logbook, users, user, canView, canManage, actions } = useStore()
  const [adding, setAdding] = useState(false)
  const everyone = canView('logbook')
  const manage = canManage('logbook')
  const [staff, setStaff] = useState('all')
  const [category, setCategory] = useState('all')
  const [date, setDate] = useState('')
  const filtered = staff !== 'all' || category !== 'all' || !!date
  const entries = logbook
    .filter((e) => everyone || e.userId === user.id)
    .filter((e) => (staff === 'all' || e.userId === staff) && (category === 'all' || e.category === category) && (!date || e.date === date))
    .sort((a, b) => b.date.localeCompare(a.date))
  const days = [...new Set(entries.map((e) => e.date))]

  return (
    <>
      <PageHead title="Logbook" sub={everyone ? 'Everything the staff have written, newest first' : 'Your daily notes'}>
        <Button onClick={() => setAdding(true)}><Plus size={16} /> New entry</Button>
      </PageHead>
      {everyone && (
        <div className="mb-4 grid gap-3 rounded-2xl bg-card p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Field label="Staff">
            <Select value={staff} onChange={(e) => setStaff(e.target.value)}>
              <option value="all">All staff</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {LOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <p className="tnum pb-2 text-[13px] text-muted">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
        </div>
      )}
      {days.length === 0 ? (
        <Card>
          <Empty title={filtered ? 'No entries match these filters' : 'No entries yet'}>{filtered ? 'Try another staff member or date.' : 'Write what you did today.'}</Empty>
        </Card>
      ) : (
        <div className="space-y-5">
          {days.map((d) => (
            <section key={d}>
              <h2 className="mb-2 text-lg font-semibold">{d === today() ? 'Today' : fmtDate(d)}</h2>
              <ul className="space-y-2">
                {entries.filter((e) => e.date === d).map((e) => {
                  const who = users.find((u) => u.id === e.userId)
                  return (
                    <li key={e.id} className="lift flex gap-3 rounded-2xl bg-card p-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-gold">{initials(who?.name ?? '?')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{e.title}</h3>
                          <Badge>{e.category}</Badge>
                        </div>
                        <p className="text-[13px] text-muted">{who?.name}</p>
                        {e.details && <p className="mt-1.5 text-sm">{e.details}</p>}
                      </div>
                      {(manage || e.userId === user.id) && (
                        <IconButton label={`Delete ${e.title}`} onClick={() => { actions.remove('logbook', e.id); actions.flash('Entry removed') }}><Trash2 size={15} /></IconButton>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      {adding && <EntryForm onClose={() => setAdding(false)} />}
    </>
  )
}
