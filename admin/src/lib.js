const TZ = 'Asia/Kolkata'

function parts(d = new Date()) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((x) => [x.type, x.value]),
  )
}

export const today = () => {
  const p = parts()
  return `${p.year}-${p.month}-${p.day}`
}

export const nowMinutes = () => {
  const p = parts()
  return Number(p.hour) * 60 + Number(p.minute)
}

export const clockText = () => {
  const p = parts()
  return `${p.hour}:${p.minute}:${p.second}`
}

export function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function addMonths(date, n) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const time12 = (m) => {
  const h = Math.floor(m / 60) % 24
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const duration = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m'
}

export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export const fmtDate = (s) =>
  s ? new Date(`${s}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'

export const fmtDay = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

export const fmtMonth = (s) =>
  new Date(`${s}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })

export const fmtMonthLong = (s) =>
  new Date(`${s}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const fmtStamp = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }) : '—'

export const fmtStampFull = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }) : '—'

export const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const UNIT_LABEL = { month: 'month', day: 'day', hour: 'hour', video: 'video' }

export const uid = () => Math.random().toString(36).slice(2, 10)

export function downloadCsv(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
