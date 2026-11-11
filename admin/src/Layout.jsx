import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, BookOpenText, CalendarClock, ChartColumn, Clock3, Fingerprint, LayoutDashboard, LogOut, Menu,
  Megaphone, Package, ReceiptText, RotateCcw, Search, Users, UserCog, WalletCards, X,
} from 'lucide-react'
import { useStore } from './store.jsx'
import { clockText, fmtStampFull, initials, nowMinutes, today } from './lib.js'
import { IconButton } from './ui.jsx'

const NAV = [
  ['Daily', [
    ['/', 'Dashboard', LayoutDashboard],
    ['/my-day', 'My day', Fingerprint],
    ['/schedule', 'Timetable', CalendarClock, 'schedule'],
  ]],
  ['Advertising', [
    ['/clients', 'Clients', Users, 'clients'],
    ['/bookings', 'Ad bookings', Megaphone, 'bookings'],
    ['/packages', 'Packages', Package, 'packages'],
  ]],
  ['Money', [
    ['/payments', 'Payments', WalletCards, 'payments'],
    ['/expenses', 'Expenses', ReceiptText, 'expenses'],
    ['/reports', 'Reports', ChartColumn, 'reports'],
  ]],
  ['Team', [
    ['/attendance', 'Attendance', Clock3, 'attendance'],
    ['/logbook', 'Logbook', BookOpenText],
    ['/staff', 'Staff and access', UserCog, 'owner'],
  ]],
]

function useAllowedNav() {
  const { canView, user } = useStore()
  return NAV.map(([group, items]) => [group, items.filter(([, , , m]) => !m || (m === 'owner' ? user.role === 'owner' : canView(m)))])
    .filter(([, items]) => items.length)
}

export const Logo = ({ size = 'md' }) => (
  <svg viewBox="0 0 120 100" role="img" aria-label="SS TV" className={`w-auto shrink-0 self-start ${{ sm: 'h-11', md: 'h-[72px]', lg: 'h-28' }[size]}`}>
    <g fill="none" stroke="#d9a928" strokeWidth="3.5" strokeLinecap="round">
      <path d="M60 22 40 5M60 22 80 5" />
      <path d="M48 88 42 97M72 88 78 97" />
    </g>
    <circle cx="40" cy="5" r="3.5" fill="#d9a928" />
    <circle cx="80" cy="5" r="3.5" fill="#d9a928" />
    <rect x="4" y="22" width="112" height="66" rx="13" fill="#161310" stroke="#d9a928" strokeWidth="3.5" />
    <text x="60" y="68" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="42" letterSpacing="1.5" fill="#d9a928">
      SS<tspan dx="6" fill="#fff">TV</tspan>
    </text>
  </svg>
)

function Sidebar({ onNavigate }) {
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto pr-3">
      {useAllowedNav().map(([group, items]) => (
        <div key={group} className="mt-4">
          <p className="pb-1 pl-6 text-[11px] font-medium uppercase tracking-[0.14em] text-muted/80">{group}</p>
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to} to={to} end={to === '/'} onClick={onNavigate}
              className={({ isActive }) => `group relative flex h-9 items-center gap-3 pl-6 text-sm transition-colors duration-150 ${
                isActive ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}
            >
              {({ isActive }) => (
                <>
                  <span className={`absolute left-0 h-6 w-1.5 rounded-r-full bg-gold-deep transition-all duration-200 ${isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`} />
                  <Icon size={17} strokeWidth={isActive ? 2.3 : 1.9} className={`transition-transform duration-150 group-hover:translate-x-0.5 ${isActive ? 'text-gold-deep' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

function OnAirCard() {
  const { schedule, canView } = useStore()
  const [clock, setClock] = useState(clockText())
  useEffect(() => {
    const timer = setInterval(() => setClock(clockText()), 1000)
    return () => clearInterval(timer)
  }, [])
  const now = nowMinutes()
  const current = (schedule[today()] ?? []).find((s) => s.start <= now && s.end > now)
  const inner = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-white/70">
        <span className="air-dot size-1.5 rounded-full bg-air" /> ON AIR
      </p>
      <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-white">{canView('schedule') ? current?.title ?? 'Nothing scheduled' : 'SS TV Tirupur'}</p>
      <p className="tnum mt-2 font-mono text-xs text-gold">{clock} IST</p>
    </>
  )
  const cls = 'hero-ink mx-3 mb-3 block rounded-2xl p-4'
  return canView('schedule') ? <Link to="/schedule" className={`lift ${cls}`}>{inner}</Link> : <div className={cls}>{inner}</div>
}

function QuickSearch() {
  const { clients, canView } = useStore()
  const nav = useAllowedNav().flatMap(([, items]) => items)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const input = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus() }
    }
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', close)
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', close) }
  }, [])

  const term = q.trim().toLowerCase()
  const results = term ? [
    ...nav.filter(([, l]) => l.toLowerCase().includes(term)).map(([to, l]) => ({ to, label: l, kind: 'Page' })),
    ...(canView('clients') ? clients.filter((c) => c.name.toLowerCase().includes(term)).map((c) => ({ to: '/clients', label: c.name, kind: 'Client' })) : []),
  ].slice(0, 7) : []

  return (
    <div ref={box} className="relative hidden w-full max-w-xs sm:block">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        ref={input} value={q} aria-label="Search pages and clients" placeholder="Search pages and clients"
        onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        className="h-10 w-full rounded-full bg-paper pl-10 pr-14 text-sm outline-none transition-shadow placeholder:text-muted focus:ring-2 focus:ring-gold/40"
      />
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted">Ctrl K</kbd>
      {open && term && (
        <ul className="pop absolute inset-x-0 top-12 z-40 overflow-hidden rounded-2xl bg-card py-1 shadow-xl">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nothing found</li>}
          {results.map((r) => (
            <li key={`${r.kind}${r.label}`}>
              <button type="button" onClick={() => { setQ(''); setOpen(false); navigate(r.to) }} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-paper">
                {r.label}<span className="text-xs text-muted">{r.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Bells() {
  const { myNotifications, user, actions } = useStore()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const navigate = useNavigate()
  const unread = myNotifications.filter((n) => !n.readBy.includes(user.id)).length

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative" ref={box}>
      <IconButton label={`Notifications, ${unread} unread`} aria-expanded={open} onClick={() => setOpen(!open)} className="relative size-10 bg-paper">
        <Bell size={18} />
        {unread > 0 && (
          <span className="tnum absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-air px-1 text-[11px] font-semibold text-white">{unread}</span>
        )}
      </IconButton>
      {open && (
        <div className="pop fixed inset-x-3 top-[4.75rem] z-40 overflow-hidden rounded-2xl bg-card shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="font-semibold">Notifications</h2>
            {unread > 0 && <button type="button" onClick={actions.readAll} className="text-[13px] text-gold-deep hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {myNotifications.length === 0 && <li className="p-6 text-center text-sm text-muted">Nothing new</li>}
            {myNotifications.map((n) => {
              const isNew = !n.readBy.includes(user.id)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => { actions.readNotification(n.id); setOpen(false); navigate(n.link) }}
                    className={`block w-full px-4 py-2.5 text-left transition-colors hover:bg-paper ${isNew ? 'bg-gold-soft/40' : ''}`}
                  >
                    <span className="flex items-start gap-2">
                      {isNew && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-air" aria-label="Unread" />}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{n.title}</span>
                        <span className="block text-[13px] text-muted">{n.body}</span>
                        <span className="mt-0.5 block text-xs text-muted">{fmtStampFull(n.at)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function SideColumn({ onNavigate, actions }) {
  return (
    <>
      <Sidebar onNavigate={onNavigate} />
      <div className="pt-3"><OnAirCard /></div>
      <div className="flex gap-1 px-3 pb-3">
        <button type="button" onClick={actions.logout} className="flex h-9 flex-1 items-center gap-2 rounded-full px-3 text-sm text-muted transition-colors hover:bg-paper hover:text-ink"><LogOut size={16} /> Log out</button>
        <IconButton label="Reset demo data" onClick={actions.reset}><RotateCcw size={15} /></IconButton>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, actions } = useStore()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const main = useRef(null)
  useEffect(() => { main.current?.scrollTo(0, 0) }, [location.pathname])

  return (
    <div className="flex h-full gap-3 p-0 sm:p-3">
      <aside className="hidden w-56 shrink-0 flex-col rounded-3xl bg-card lg:flex">
        <div className="px-6 pb-0 pt-4"><Logo /><p className="mt-1.5 text-xs text-muted">Tirupur · Admin panel</p></div>
        <SideColumn actions={actions} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="fade absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <aside className="pop relative flex h-full w-64 flex-col bg-card">
            <div className="flex items-center justify-between px-5 pt-4">
              <Logo size="sm" />
              <IconButton label="Close menu" onClick={() => setDrawer(false)}><X size={20} /></IconButton>
            </div>
            <SideColumn onNavigate={() => setDrawer(false)} actions={actions} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden bg-paper sm:rounded-3xl">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-card px-3 sm:mx-3 sm:mt-3 sm:rounded-2xl sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <IconButton label="Open menu" className="lg:hidden" onClick={() => setDrawer(true)}><Menu size={20} /></IconButton>
            <span className="mr-2 lg:hidden"><Logo size="sm" /></span>
            <QuickSearch />
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="hidden rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold-deep xl:block">Demo with sample data</span>
            <Bells />
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-gold">{initials(user.name)}</span>
              <span className="hidden min-w-0 md:block">
                <span className="block max-w-40 truncate text-sm font-semibold leading-tight">{user.name}</span>
                <span className="block max-w-40 truncate text-xs text-muted">{user.job}</span>
              </span>
            </div>
          </div>
        </header>
        <main ref={main} className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="page-in mx-auto max-w-[1240px] px-4 pb-6 pt-2 sm:px-5"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
