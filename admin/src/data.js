import { addDays, addMonths, today, toMin } from './lib.js'

export const MODULES = [
  ['schedule', 'Timetable'],
  ['clients', 'Clients'],
  ['packages', 'Packages'],
  ['bookings', 'Ad bookings'],
  ['payments', 'Payments'],
  ['expenses', 'Expenses'],
  ['reports', 'Reports'],
  ['attendance', 'Staff attendance'],
  ['logbook', 'Staff logbook'],
]

export const LEVELS = [
  ['none', 'No access'],
  ['view', 'View'],
  ['manage', 'Manage'],
]

export const PROGRAM_TYPES = ['News', 'Live', 'Recorded', 'Devotional', 'Entertainment', 'Sponsored', 'Repeat', 'Other']
export const EXPENSE_CATEGORIES = ['Salary', 'Rent', 'Electricity', 'Equipment', 'Internet and cable', 'Transport', 'Marketing', 'Production', 'Office', 'Other']
export const PAY_METHODS = ['Cash', 'UPI', 'Bank transfer', 'Cheque', 'Other']
export const LOG_CATEGORIES = ['Shift note', 'Broadcast', 'Technical issue', 'Client', 'Field work', 'Other']

const perms = (schedule, clients, packages, bookings, payments, expenses, reports, attendance, logbook) => ({
  schedule, clients, packages, bookings, payments, expenses, reports, attendance, logbook,
})

const PACKAGES = [
  ['Scrolling advertisement', 'Top scrolling', 5000, 'month', '50 times displaying'],
  ['Scrolling advertisement', 'Middle scrolling', 4500, 'month', '120 times displaying'],
  ['Scrolling advertisement', 'Bottom scrolling', 2500, 'month', '80 times displaying'],
  ['Live', 'Live sponsor', 1000, 'hour', '₹500 or ₹1,000 for 1 hour, depends on the client'],
  ['Visual advertisement', 'Visual ad, 30 seconds', 8000, 'month', '30 seconds, every half an hour'],
  ['Visual advertisement', 'Visual ad, 1 minute', 10000, 'month', '1 minute, every half an hour'],
  ['Visual advertisement', 'Visual ad, 1 minute 30 seconds', 12000, 'month', '1 minute 30 seconds, every half an hour'],
  ['Live', 'Direct live', 2500, 'day', 'Direct live coverage'],
  ['Recording', 'Recording program, 1 hour', 1000, 'video', '1 hour recorded program'],
  ['Recording', 'Half an hour video', 500, 'day', 'Half an hour recorded video'],
].map(([category, name, price, unit, details], i) => ({ id: `p${i + 1}`, category, name, price, unit, details, active: true }))

const DAY_TEMPLATE = [
  ['00:00', '05:30', 'Night repeat telecast', 'Repeat', ''],
  ['05:30', '07:00', 'Morning Bakthi', 'Devotional', ''],
  ['07:00', '08:00', 'Rasi Palan', 'Recorded', 'Astrology desk'],
  ['08:00', '08:30', 'Morning News', 'News', 'News desk'],
  ['08:30', '10:00', 'Tirupur Today', 'Recorded', ''],
  ['10:00', '12:00', 'Comedy and Songs', 'Entertainment', ''],
  ['12:00', '12:30', 'Noon News', 'News', 'News desk'],
  ['12:30', '14:00', 'Sponsored Special', 'Sponsored', ''],
  ['14:00', '16:00', 'Afternoon repeat', 'Repeat', ''],
  ['16:00', '18:00', 'Songs of the Day', 'Entertainment', ''],
  ['18:00', '19:00', 'Neyar Viruppam', 'Live', 'VJ on duty'],
  ['19:00', '20:00', 'Sirappu Neralai', 'Live', 'VJ on duty'],
  ['20:00', '20:30', 'Evening News', 'News', 'News desk'],
  ['20:30', '22:00', 'Local Events', 'Recorded', ''],
  ['22:00', '24:00', 'Late repeat', 'Repeat', ''],
]

const t = today()
const month = t.slice(0, 7)

function daySchedule(date) {
  return DAY_TEMPLATE.map(([s, e, title, type, presenter], i) => ({
    id: `s-${date}-${i}`, date, start: toMin(s), end: toMin(e), title, type, presenter, notes: '',
  }))
}

const stamp = (date, hhmm) => new Date(`${date}T${hhmm}:00+05:30`).toISOString()

function attendanceFor(userId, offset, inAt, outAt) {
  const date = addDays(t, offset)
  return { id: `a-${userId}-${offset}`, userId, date, in: stamp(date, inAt), out: outAt ? stamp(date, outAt) : null, note: '' }
}

export function createSampleData() {
  const bookings = [
    { client: 'c1', pkg: 'p6', agreed: 10000, qty: 3, billing: 'paid', start: addDays(t, -40), months: 3, due: addDays(t, -30), mode: 'interval', interval: 30, from: '06:00', to: '22:00', status: 'active' },
    { client: 'c2', pkg: 'p1', agreed: 4500, qty: 1, billing: 'paid', start: addDays(t, -27), months: 1, due: addDays(t, -6), mode: 'times', times: ['07:30', '12:30', '19:30'], status: 'active' },
    { client: 'c3', pkg: 'p4', agreed: 500, qty: 12, billing: 'paid', start: addDays(t, -8), days: 12, due: addDays(t, 6), mode: 'times', times: ['18:00'], status: 'active' },
    { client: 'c4', pkg: 'p3', agreed: 2500, qty: 1, billing: 'mutual', start: addDays(t, -15), months: 1, due: null, mode: 'times', times: ['09:00', '13:00', '21:00'], status: 'active' },
    { client: 'c5', pkg: 'p5', agreed: 0, qty: 1, billing: 'zero', start: addDays(t, -5), months: 1, due: null, mode: 'interval', interval: 60, from: '08:00', to: '20:00', status: 'active' },
    { client: 'c6', pkg: 'p2', agreed: 4500, qty: 2, billing: 'paid', start: addDays(t, -58), months: 2, due: addDays(t, -50), mode: 'times', times: ['08:15', '18:45'], status: 'active' },
    { client: 'c2', pkg: 'p8', agreed: 2500, qty: 1, billing: 'paid', start: addDays(t, 5), days: 1, due: addDays(t, 5), mode: 'times', times: ['10:00'], status: 'active' },
  ].map((b, i) => {
    const pkg = PACKAGES.find((p) => p.id === b.pkg)
    return {
      id: `b${i + 1}`, clientId: b.client, packageId: b.pkg, packageName: pkg.name, unit: pkg.unit,
      listPrice: pkg.price, agreedPrice: b.agreed, quantity: b.qty, billing: b.billing,
      start: b.start, end: b.months ? addDays(addMonths(b.start, b.months), -1) : addDays(b.start, b.days - 1), due: b.due,
      mode: b.mode, times: b.times ?? [], interval: b.interval ?? 30, from: b.from ?? '06:00', to: b.to ?? '22:00',
      status: b.status, notes: '',
    }
  })

  const schedule = {}
  for (let i = -2; i <= 7; i++) schedule[addDays(t, i)] = daySchedule(addDays(t, i))
  schedule[addDays(t, 3)] = schedule[addDays(t, 3)].filter((s) => s.start < toMin('16:00') || s.start >= toMin('20:00'))

  return {
    userId: null,
    packages: PACKAGES,
    users: [
      { id: 'u1', name: 'Owner', username: 'owner', role: 'owner', job: 'Owner', phone: '', active: true, permissions: {} },
      { id: 'u2', name: 'Sample Programme Lead', username: 'programme', role: 'staff', job: 'Programme lead', phone: '', active: true, permissions: perms('manage', 'view', 'view', 'view', 'none', 'none', 'none', 'view', 'view') },
      { id: 'u3', name: 'Sample Ad Sales', username: 'sales', role: 'staff', job: 'Ad sales', phone: '', active: true, permissions: perms('view', 'manage', 'view', 'manage', 'view', 'none', 'none', 'none', 'none') },
      { id: 'u4', name: 'Sample Accountant', username: 'accounts', role: 'staff', job: 'Accounts', phone: '', active: true, permissions: perms('none', 'view', 'view', 'view', 'manage', 'manage', 'view', 'view', 'none') },
      { id: 'u5', name: 'Sample Reporter', username: 'reporter', role: 'staff', job: 'Reporter', phone: '', active: true, permissions: perms('view', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none') },
    ],
    clients: [
      ['Sample Knit Exports', 'Garment exporter'], ['Sample Jewellers', 'Jewellery showroom'], ['Sample Astrology Centre', 'Astrology'],
      ['Sample Promoters', 'Real estate'], ['Sample Trust', 'Charity, zero payment'], ['Sample Textiles', 'Textile showroom'],
    ].map(([name, business], i) => ({ id: `c${i + 1}`, name, business, phone: '', email: '', address: 'Tirupur', gstin: '', notes: '', active: true })),
    bookings,
    payments: [
      { id: 'pay1', bookingId: 'b1', amount: 20000, date: addDays(t, -30), method: 'Bank transfer', reference: '' },
      { id: 'pay2', bookingId: 'b2', amount: 2000, date: addDays(t, -20), method: 'UPI', reference: '' },
      { id: 'pay3', bookingId: 'b6', amount: 9000, date: addDays(t, -52), method: 'Cheque', reference: '' },
      { id: 'pay4', bookingId: 'b3', amount: 3000, date: addDays(t, -4), method: 'Cash', reference: '' },
      { id: 'pay5', bookingId: 'b1', amount: 5000, date: t, method: 'UPI', reference: '' },
      { id: 'pay6', bookingId: 'b3', amount: 1000, date: t, method: 'Cash', reference: '' },
    ],
    expenses: [
      ['Salary', 'Staff salaries', 62000, 'Staff', 'Bank transfer', 1],
      ['Rent', 'Studio rent', 18000, 'Sample landlord', 'Bank transfer', 2],
      ['Electricity', 'Studio electricity bill', 6400, 'TNPDCL', 'UPI', 4],
      ['Internet and cable', 'Internet line', 2800, 'Sample ISP', 'UPI', 5],
      ['Transport', 'Event coverage travel', 1900, 'Driver', 'Cash', 12],
      ['Equipment', 'Camera battery', 4500, 'Sample store', 'Cash', 17],
    ].map(([category, title, amount, vendor, method, day], i) => ({
      id: `e${i + 1}`, category, title, amount, vendor, method, date: `${month}-${String(Math.min(day, Number(t.slice(8)))).padStart(2, '0')}`, notes: '',
    })),
    schedule,
    attendance: [
      attendanceFor('u2', 0, '08:52', null), attendanceFor('u3', 0, '09:47', null),
      attendanceFor('u2', -1, '08:58', '18:10'), attendanceFor('u3', -1, '10:05', '18:30'), attendanceFor('u4', -1, '09:30', '17:45'), attendanceFor('u5', -1, '09:02', '19:20'),
      attendanceFor('u2', -2, '09:01', '18:05'), attendanceFor('u4', -2, '09:28', null),
    ],
    logins: [
      { id: 'l1', userId: 'u2', in: stamp(t, '08:51'), out: null, device: 'Chrome on Windows' },
      { id: 'l2', userId: 'u3', in: stamp(t, '09:46'), out: null, device: 'Chrome on Android' },
      { id: 'l3', userId: 'u4', in: stamp(addDays(t, -1), '09:29'), out: stamp(addDays(t, -1), '17:46'), device: 'Chrome on Windows' },
      { id: 'l4', userId: 'u5', in: stamp(addDays(t, -1), '09:01'), out: stamp(addDays(t, -1), '19:21'), device: 'Chrome on Android' },
    ],
    logbook: [
      { id: 'lg1', userId: 'u2', date: t, category: 'Broadcast', title: 'Morning rundown checked', details: 'All morning programs aired on time.' },
      { id: 'lg2', userId: 'u5', date: addDays(t, -1), category: 'Field work', title: 'Covered exhibition at the town hall', details: 'Footage handed to the edit desk.' },
      { id: 'lg3', userId: 'u3', date: addDays(t, -1), category: 'Client', title: 'Met two new advertisers', details: 'Shared the scrolling ad package rates.' },
    ],
    notifications: [
      { id: 'n1', module: 'payments', title: 'Payment overdue: Sample Jewellers', body: '₹2,500 balance is past its due date', link: '/payments', at: stamp(t, '09:00'), readBy: [] },
      { id: 'n2', module: 'bookings', title: 'Ad ending soon: Sample Jewellers', body: 'Top scrolling ends in 3 days', link: '/bookings', at: stamp(t, '08:00'), readBy: [] },
      { id: 'n3', module: 'schedule', title: 'Timetable has a gap', body: 'Part of the evening is not scheduled in 3 days', link: `/schedule?date=${addDays(t, 3)}`, at: stamp(addDays(t, -1), '18:00'), readBy: [] },
      { id: 'n4', module: 'expenses', title: 'Expense added: Camera battery', body: '₹4,500 under Equipment', link: '/expenses', at: stamp(addDays(t, -1), '15:20'), readBy: [] },
    ],
  }
}

// Past months for the demo report. The current month is worked out from live sample records.
export const SAMPLE_HISTORY = [
  [92000, 86000, 68000], [101000, 98000, 69500], [114000, 110000, 73000], [108000, 106500, 70000], [123000, 116000, 76500],
  [119000, 121000, 74000], [131000, 124500, 80000], [136000, 132000, 78500], [142000, 135000, 82000], [158000, 144000, 86000], [150000, 141000, 83000],
]
