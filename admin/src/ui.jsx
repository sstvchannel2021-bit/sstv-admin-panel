import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, X, Eye } from 'lucide-react'

const BTN = {
  primary: 'bg-ink text-white hover:bg-ink-3',
  gold: 'bg-gold text-ink hover:brightness-95',
  soft: 'bg-card border border-ink/25 text-text hover:bg-ink hover:text-white hover:border-ink',
  ghost: 'text-muted hover:bg-paper hover:text-text',
  danger: 'text-air hover:bg-air-soft',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...p }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm'
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-all duration-150 active:scale-95 disabled:opacity-50 ${sz} ${BTN[variant]} ${className}`}
      {...p}
    />
  )
}

export function IconButton({ label, className = '', ...p }) {
  return (
    <button
      type="button" aria-label={label} title={label}
      className={`inline-grid size-9 place-items-center rounded-full text-muted transition-all duration-150 hover:bg-paper hover:text-text active:scale-90 ${className}`}
      {...p}
    />
  )
}

const CONTROL = 'h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-text transition-shadow placeholder:text-muted/70 focus:border-gold-deep focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:bg-paper'

export const Input = (p) => <input {...p} className={`${CONTROL} ${p.className ?? ''}`} />
export const Textarea = (p) => <textarea rows={3} {...p} className={`${CONTROL} h-auto py-2 ${p.className ?? ''}`} />
export const Select = ({ children, ...p }) => <select {...p} className={`${CONTROL} ${p.className ?? ''}`}>{children}</select>

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[13px] font-medium text-text">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Card({ title, action, children, className = '', pad = true }) {
  return (
    <section className={`rounded-2xl bg-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? 'px-5 pt-2 pb-5' : 'pb-2'}>{children}</div>
    </section>
  )
}

export function PageHead({ title, sub, viewOnly, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">{title}</h1>
          {viewOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-medium text-info">
              <Eye size={13} /> View only
            </span>
          )}
        </div>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

const TONES = {
  good: 'bg-good-soft text-good', warn: 'bg-warn-soft text-warn', bad: 'bg-air-soft text-air',
  info: 'bg-info-soft text-info', gold: 'bg-gold-soft text-gold-deep', plain: 'bg-paper text-muted border border-line',
}

export const Badge = ({ tone = 'plain', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>{children}</span>
)

const PAY = {
  paid: ['good', 'Paid'], partial: ['warn', 'Part paid'], unpaid: ['plain', 'Not paid'],
  overdue: ['bad', 'Overdue'], none: ['info', 'No payment'],
}
export const PayBadge = ({ status }) => <Badge tone={PAY[status][0]}>{PAY[status][1]}</Badge>

const BILLING = { paid: ['plain', 'Paid client'], mutual: ['gold', 'Mutual understanding'], zero: ['info', 'Zero payment'] }
export const BillingBadge = ({ type }) => <Badge tone={BILLING[type][0]}>{BILLING[type][1]}</Badge>

export function useCountUp(target, ms = 800) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(target)
    let frame
    const start = performance.now()
    const step = (t) => {
      const p = Math.min((t - start) / ms, 1)
      setN(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return n
}

// Works on any figure such as 25, ₹25,000 or -₹1,500, keeping its prefix.
export function CountUp({ value }) {
  const m = String(value).match(/^(\D*)([\d,]+)$/)
  const n = useCountUp(m ? Number(m[2].replaceAll(',', '')) : 0)
  return m ? `${m[1]}${n.toLocaleString('en-IN')}` : value
}

export function Stat({ label, value, note, tone, to, hero }) {
  const color = hero ? 'text-white' : tone === 'bad' ? 'text-air' : tone === 'good' ? 'text-good' : 'text-text'
  return (
    <div className={`lift relative rounded-2xl px-5 py-4 ${hero ? 'hero-ink text-white' : 'bg-card'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium ${hero ? 'text-white/80' : 'text-text'}`}>{label}</p>
        {to && (
          <Link to={to} aria-label={`Open ${label}`}
            className={`arrow-spin -mr-1 -mt-0.5 grid size-8 shrink-0 place-items-center rounded-full after:absolute after:inset-0 after:rounded-2xl ${hero ? 'bg-white text-ink' : 'border border-ink/30 text-ink'}`}>
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <p className={`tnum mt-2 text-3xl font-semibold tracking-tight sm:text-[34px] ${color}`}><CountUp value={value} /></p>
      {note && <p className={`mt-1 text-xs ${hero ? 'text-gold' : 'text-muted'}`}>{note}</p>}
    </div>
  )
}

export function Table({ head, children, minWidth = 680 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            {head.map((h, i) => <th key={i} className={`px-4 py-2.5 font-medium ${h.right ? 'text-right' : ''}`}>{h.label ?? h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&_td]:px-4 [&_td]:py-3 [&_tr]:transition-colors">{children}</tbody>
      </table>
    </div>
  )
}

export const Empty = ({ title, children }) => (
  <div className="px-6 py-10 text-center">
    <p className="font-medium">{title}</p>
    {children && <p className="mt-1 text-sm text-muted">{children}</p>}
  </div>
)

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`pop flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-card sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <header className="flex items-center justify-between border-b border-line px-6 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export const FormFoot = ({ onCancel, label = 'Save', error }) => (
  <>
    {error && <p role="alert" className="rise mt-4 rounded-xl bg-air-soft px-3 py-2 text-sm text-air">{error}</p>}
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      <Button type="submit">{label}</Button>
    </div>
  </>
)

export function Tabs({ value, onChange, options }) {
  return (
    <div role="tablist" className="inline-flex rounded-full bg-card p-1">
      {options.map(([v, label]) => (
        <button
          key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`h-8 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${value === v ? 'bg-ink text-white' : 'text-muted hover:text-text'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export const form = (fn) => (e) => { e.preventDefault(); fn() }
