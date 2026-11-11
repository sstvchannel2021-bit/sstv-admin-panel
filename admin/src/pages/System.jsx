import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '../ui.jsx'

const Box = ({ title, children }) => (
  <div className="mx-auto mt-16 max-w-sm text-center">
    <Lock className="mx-auto text-muted" size={28} />
    <h1 className="mt-3 font-display text-3xl font-bold tracking-wide">{title}</h1>
    <p className="mt-1 text-sm text-muted">{children}</p>
    <Link to="/"><Button className="mt-5">Back to dashboard</Button></Link>
  </div>
)

export const NoAccess = () => <Box title="No access">Your account does not have access to this page. Ask the owner if you need it.</Box>
export const NotFound = () => <Box title="Page not found">This page does not exist.</Box>
