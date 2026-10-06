import { Navigate } from 'react-router-dom'

/**
 * Legacy stub — the dashboard now hosts profile editing under
 *   /dashboard?tab=profile
 * Anything still reaching this page bounces over.
 */
export default function Profile() {
  return <Navigate to="/dashboard?tab=profile" replace />
}
