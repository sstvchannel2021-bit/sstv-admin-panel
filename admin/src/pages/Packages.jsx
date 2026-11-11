import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNIT_LABEL, rupees } from '../lib.js'
import { Badge, Button, Field, FormFoot, IconButton, Input, Modal, PageHead, Select, form } from '../ui.jsx'

function PackageForm({ pkg, onClose }) {
  const { actions } = useStore()
  const [f, setF] = useState(pkg ?? { category: 'Scrolling advertisement', name: '', price: '', unit: 'month', details: '', active: true })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name.trim()) return setError('Enter the package name')
    if (f.price === '' || Number(f.price) < 0) return setError('Enter the price')
    const item = { ...f, price: Number(f.price) }
    pkg ? actions.update('packages', pkg.id, item) : actions.add('packages', item)
    actions.flash('Package saved')
    onClose()
  }
  return (
    <Modal title={pkg ? 'Edit package' : 'Add package'} onClose={onClose}>
      <form onSubmit={form(save)} className="space-y-3">
        <Field label="Group"><Input value={f.category} onChange={set('category')} /></Field>
        <Field label="Package name"><Input autoFocus value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Standard price (₹)"><Input type="number" min="0" value={f.price} onChange={set('price')} /></Field>
          <Field label="Charged per"><Select value={f.unit} onChange={set('unit')}>{Object.keys(UNIT_LABEL).map((u) => <option key={u}>{u}</option>)}</Select></Field>
        </div>
        <Field label="What is included"><Input value={f.details} onChange={set('details')} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#80600c]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Available to sell</label>
        <FormFoot onCancel={onClose} error={error} />
      </form>
    </Modal>
  )
}

export default function Packages() {
  const { packages, canManage } = useStore()
  const [editing, setEditing] = useState(null)
  const manage = canManage('packages')
  const groups = [...new Set(packages.map((p) => p.category))]

  return (
    <>
      <PageHead title="Packages" sub="Standard prices. Each booking can agree its own custom price without changing these." viewOnly={!manage}>
        {manage && <Button onClick={() => setEditing('new')}><Plus size={16} /> Add package</Button>}
      </PageHead>
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-2 text-xl font-semibold">{g}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {packages.filter((p) => p.category === g).map((p) => (
                <article key={p.id} className="lift flex flex-col rounded-2xl bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{p.name}</h3>
                    {manage && <IconButton label={`Edit ${p.name}`} className="-mr-2 -mt-2" onClick={() => setEditing(p)}><Pencil size={15} /></IconButton>}
                  </div>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tnum">{rupees(p.price)}<span className="ml-1 font-sans text-sm font-normal text-muted">per {p.unit}</span></p>
                  <p className="mt-1 flex-1 text-[13px] text-muted">{p.details}</p>
                  {!p.active && <div className="mt-2"><Badge>Not on sale</Badge></div>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {editing && <PackageForm pkg={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
