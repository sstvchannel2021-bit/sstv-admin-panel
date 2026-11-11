import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createSampleData, MODULES, SAMPLE_HISTORY } from './data.js'
import { today, uid } from './lib.js'

const KEY = 'sstv-admin-demo-v2'
const Ctx = createContext(null)

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.users) return saved
  } catch {}
  return createSampleData()
}

export const bookingTotal = (b) => (b.billing === 'zero' ? 0 : b.agreedPrice * b.quantity)

export function bookingMoney(b, payments, date = today()) {
  const total = bookingTotal(b)
  const paid = payments.filter((p) => p.bookingId === b.id).reduce((s, p) => s + p.amount, 0)
  const balance = Math.max(total - paid, 0)
  let status = 'unpaid'
  if (total === 0) status = 'none'
  else if (paid >= total) status = 'paid'
  else if (b.due && b.due < date) status = 'overdue'
  else if (paid > 0) status = 'partial'
  return { total, paid, balance, status }
}

export function monthSeries({ bookings, payments, expenses }, year) {
  const t = today()
  const live = (key) => ({
    booked: bookings.filter((b) => b.status !== 'cancelled' && b.start.startsWith(key)).reduce((s, b) => s + bookingTotal(b), 0),
    collected: payments.filter((p) => p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0),
    expenses: expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0),
  })
  return Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    const now = live(key)
    const past = year === Number(t.slice(0, 4)) && key < t.slice(0, 7) ? SAMPLE_HISTORY[i] : null
    const row = past ? { booked: past[0] + now.booked, collected: past[1] + now.collected, expenses: past[2] + now.expenses } : now
    return { month: key, ...row, profit: row.collected - row.expenses }
  })
}

export const slotText = (b) =>
  b.mode === 'times' ? b.times.join(', ') : `Every ${b.interval} min, ${b.from} to ${b.to}`

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  }, [state])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const user = state.users.find((u) => u.id === state.userId) ?? null

  const level = useCallback((module) => {
    if (!user) return 'none'
    if (user.role === 'owner') return 'manage'
    return user.permissions[module] ?? 'none'
  }, [user])

  const actions = useMemo(() => {
    const notice = (s, n) => ({
      ...s,
      notifications: [{ id: uid(), at: new Date().toISOString(), readBy: [s.userId], link: '/', ...n }, ...s.notifications],
    })
    return {
      flash: (message) => setToast(message),
      login: (userId) => setState((s) => ({
        ...s, userId,
        logins: [{ id: uid(), userId, in: new Date().toISOString(), out: null, device: 'This browser' }, ...s.logins],
      })),
      logout: () => setState((s) => ({
        ...s, userId: null,
        logins: s.logins.map((l) => (l.userId === s.userId && !l.out ? { ...l, out: new Date().toISOString() } : l)),
      })),
      reset: () => setState({ ...createSampleData(), userId: null }),
      add: (key, item, n) => setState((s) => {
        const next = { ...s, [key]: [{ id: uid(), ...item }, ...s[key]] }
        return n ? notice(next, n) : next
      }),
      update: (key, id, patch) => setState((s) => ({
        ...s, [key]: s[key].map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
      remove: (key, id) => setState((s) => ({ ...s, [key]: s[key].filter((x) => x.id !== id) })),
      saveProgram: (date, item, n) => setState((s) => {
        const day = s.schedule[date] ?? []
        const list = item.id
          ? day.map((x) => (x.id === item.id ? { ...x, ...item, date } : x))
          : [...day, { ...item, id: uid(), date }]
        return notice({ ...s, schedule: { ...s.schedule, [date]: list } }, n)
      }),
      removeProgram: (date, id, n) => setState((s) => notice({
        ...s, schedule: { ...s.schedule, [date]: (s.schedule[date] ?? []).filter((x) => x.id !== id) },
      }, n)),
      copyDay: (from, dates) => setState((s) => {
        const schedule = { ...s.schedule }
        for (const date of dates) {
          schedule[date] = (s.schedule[from] ?? []).map((x) => ({ ...x, id: uid(), date }))
        }
        return { ...s, schedule }
      }),
      clockIn: () => setState((s) => ({
        ...s,
        attendance: [{ id: uid(), userId: s.userId, date: today(), in: new Date().toISOString(), out: null, note: '' }, ...s.attendance],
      })),
      clockOut: () => setState((s) => ({
        ...s,
        attendance: s.attendance.map((a) => (a.userId === s.userId && a.date === today() && !a.out ? { ...a, out: new Date().toISOString() } : a)),
      })),
      readNotification: (id) => setState((s) => ({
        ...s, notifications: s.notifications.map((n) => (n.id === id && !n.readBy.includes(s.userId) ? { ...n, readBy: [...n.readBy, s.userId] } : n)),
      })),
      readAll: () => setState((s) => ({
        ...s, notifications: s.notifications.map((n) => (n.readBy.includes(s.userId) ? n : { ...n, readBy: [...n.readBy, s.userId] })),
      })),
    }
  }, [])

  const value = useMemo(() => ({
    ...state, user, level, actions, toast,
    canView: (m) => level(m) !== 'none',
    canManage: (m) => level(m) === 'manage',
    myNotifications: state.notifications.filter((n) => level(n.module) !== 'none'),
  }), [state, user, level, actions, toast])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
export const MODULE_KEYS = MODULES.map(([k]) => k)
