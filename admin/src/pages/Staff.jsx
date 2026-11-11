import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { LEVELS, MODULES } from '../data.js'
import { initials, uid } from '../lib.js'
import { Badge, Button, Card, Field, FormFoot, Input, Modal, PageHead, Table, form } from '../ui.jsx'

const blank = Object.fromEntries(MODULES.map(([m]) => [m, 'none']))
const PRESETS = [
  ['No access', () => blank],
  ['View everything', () => Object.fromEntries(MODULES.map(([m]) => [m, 'view']))],
  ['Manage everything', () => Object.fromEntries(MODULES.map(([m]) => [m, 'manage']))],
]

const LEVEL_STYLE = { none: 'bg-ink-3 text-white', view: 'bg-info text-white', manage: 'bg-good text-white' }

function StaffForm({ person, onClose }) {
  const { users, actions } = useStore()
  const [f, setF] = useState(person ?? { name: '', username: '', job: '', phone: '', role: 'staff', active: true, permissions: blank })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const perm = (m, level) => setF({ ...f, permissions: { ...f.permissions, [m]: level } })

  const save = () => {
    if (!f.name.trim() || !f.username.trim()) return setError('Enter the name and username')
    if (users.some((u) => u.id !== person?.id && u.username.toLowerCase() === f.username.trim().toLowerCase())) return setError('That username is taken')
    person ? actions.update('users', person.id, f) : actions.add('users', { ...f, id: uid() })
    actions.flash('Staff saved')
    onClose()
  }

  return (
    <Modal title={person ? `Edit ${person.name}` : 'Add staff'} onClose={onClose} wide>
      <form onSubmit={form(save)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><Input autoFocus value={f.name} onChange={set('name')} /></Field>
          <Field label="Job title"><Input value={f.job} onChange={set('job')} /></Field>
          <Field label="Username"><Input value={f.username} onChange={set('username')} autoComplete="off" /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
        </div>
        {f.role === 'owner' ? (
          <p className="mt-4 rounded-xl bg-gold-soft px-3 py-2 text-sm text-gold-deep">The owner always has full access to everything.</p>
        ) : (
          <fieldset className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <legend className="text-lg font-semibold">Access and permissions</legend>
              <div className="flex gap-1">
                {PRESETS.map(([label, make]) => <Button key={label} variant="ghost" size="sm" onClick={() => setF({ ...f, permissions: make() })}>{label}</Button>)}
              </div>
            </div>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {MODULES.map(([m, label]) => (
                <li key={m} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span role="radiogroup" aria-label={`${label} permission`} className="inline-flex rounded-xl border border-line bg-paper p-0.5">
                    {LEVELS.map(([v, l]) => {
                      const on = (f.permissions[m] ?? 'none') === v
                      return (
                        <button key={v} type="button" role="radio" aria-checked={on} onClick={() => perm(m, v)}
                          className={`h-7 rounded px-2.5 text-xs font-medium transition-colors ${on ? LEVEL_STYLE[v] : 'text-muted hover:text-text'}`}>{l}</button>
                      )
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Manage can change things. View can only look. No access hides the page completely.</p>
          </fieldset>
        )}
        {person && f.role !== 'owner' && (
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#80600c]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Account active</label>
        )}
        <FormFoot onCancel={onClose} error={error} />
      </form>
    </Modal>
  )
}

const dot = { none: 'bg-line', view: 'bg-info', manage: 'bg-good' }

export default function Staff() {
  const { users } = useStore()
  const [editing, setEditing] = useState(null)

  return (
    <>
      <PageHead title="Staff and access" sub="Only the owner can see this page">
        <Button onClick={() => setEditing('new')}><Plus size={16} /> Add staff</Button>
      </PageHead>
      <Card pad={false}>
        <Table minWidth={1000} head={['Staff', ...MODULES.map(([, l]) => l.replace('Staff ', '')), '']}>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <span className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-gold">{initials(u.name)}</span>
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap font-medium">{u.name}</span>
                    <span className="block text-[13px] text-muted">@{u.username} · {u.job}</span>
                  </span>
                  {!u.active && <Badge>Inactive</Badge>}
                </span>
              </td>
              {MODULES.map(([m, label]) => {
                const level = u.role === 'owner' ? 'manage' : u.permissions[m] ?? 'none'
                const text = level === 'none' ? 'None' : LEVELS.find(([v]) => v === level)[1]
                return (
                  <td key={m} title={`${label}: ${text}`} className="!px-2">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
                      <span className={`size-2 rounded-full ${dot[level]}`} />
                      <span className={level === 'none' ? 'text-muted' : ''}>{text}</span>
                    </span>
                  </td>
                )
              })}
              <td><Button variant="ghost" size="sm" onClick={() => setEditing(u)}>Edit</Button></td>
            </tr>
          ))}
        </Table>
      </Card>
      {editing && <StaffForm person={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
