import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../ui/LoadingSpinner'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return children
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, profile, user } = useAuth()
  const location = useLocation()

  // If we're still bootstrapping auth, or the user is logged in but the
  // profile hasn't been resolved yet, wait — otherwise we redirect a real
  // admin away because `isAdmin` defaults to false.
  if (loading || (user && !profile)) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
