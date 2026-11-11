import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store.jsx'
import Layout from './Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyDay from './pages/MyDay.jsx'
import Schedule from './pages/Schedule.jsx'
import Clients from './pages/Clients.jsx'
import Packages from './pages/Packages.jsx'
import Bookings from './pages/Bookings.jsx'
import Payments from './pages/Payments.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import Attendance from './pages/Attendance.jsx'
import Logbook from './pages/Logbook.jsx'
import Staff from './pages/Staff.jsx'
import { NoAccess, NotFound } from './pages/System.jsx'

function Guard({ module, ownerOnly, children }) {
  const { canView, user } = useStore()
  const allowed = ownerOnly ? user.role === 'owner' : canView(module)
  return allowed ? children : <NoAccess />
}

export default function App() {
  const { user, toast } = useStore()
  const location = useLocation()
  if (!user) return location.pathname === '/login' ? <Login /> : <Navigate to="/login" replace />
  return (
    <>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="my-day" element={<MyDay />} />
          <Route path="schedule" element={<Guard module="schedule"><Schedule /></Guard>} />
          <Route path="clients" element={<Guard module="clients"><Clients /></Guard>} />
          <Route path="packages" element={<Guard module="packages"><Packages /></Guard>} />
          <Route path="bookings" element={<Guard module="bookings"><Bookings /></Guard>} />
          <Route path="payments" element={<Guard module="payments"><Payments /></Guard>} />
          <Route path="expenses" element={<Guard module="expenses"><Expenses /></Guard>} />
          <Route path="reports" element={<Guard module="reports"><Reports /></Guard>} />
          <Route path="attendance" element={<Guard module="attendance"><Attendance /></Guard>} />
          <Route path="logbook" element={<Logbook />} />
          <Route path="staff" element={<Guard ownerOnly><Staff /></Guard>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      {toast && (
        <div role="status" className="rise fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}
