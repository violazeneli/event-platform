import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ConnectionGuard from './components/layout/ConnectionGuard'
import ErrorBoundary from './components/layout/ErrorBoundary'
import ScrollToTop from './components/layout/ScrollToTop'
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/auth/ProtectedRoute'
import { PageLoader } from './components/ui/LoadingSpinner'

// Eagerly loaded — needed for the initial paint
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

// Lazy-loaded — these only ship JS when the user actually navigates there.
// Cuts first-paint bundle dramatically.
const UpcomingEvents  = lazy(() => import('./pages/UpcomingEvents'))
const PastEvents      = lazy(() => import('./pages/PastEvents'))
const EventDetail     = lazy(() => import('./pages/EventDetail'))
const CreateEvent     = lazy(() => import('./pages/CreateEvent'))
const EditEvent       = lazy(() => import('./pages/EditEvent'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'))
const AuthCallback    = lazy(() => import('./pages/AuthCallback'))
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword   = lazy(() => import('./pages/ResetPassword'))
const Debug           = lazy(() => import('./pages/Debug'))
const NotFound        = lazy(() => import('./pages/NotFound'))

// Prefetch the most common routes on idle — by the time the user actually
// clicks "Events ▾ → Upcoming" the chunk is already in the browser cache,
// so the navigation is instant. Cheaper than eager-bundling them in.
if (typeof window !== 'undefined') {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200))
  idle(() => {
    import('./pages/UpcomingEvents')
    import('./pages/EventDetail')
    import('./pages/Dashboard')
  })
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1a1428',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
            },
            success: { iconTheme: { primary: '#ec4899', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        {/* Global connectivity check — surfaces a banner if Supabase is unreachable */}
        <ConnectionGuard />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth routes — only for guests */}
            <Route path="/signin" element={<GuestRoute><SignIn /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />

            {/* Email-confirmation / password-reset landing page */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Password reset flow */}
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Browser-side diagnostic */}
            <Route path="/debug" element={<Debug />} />

            {/* Public routes */}
            <Route path="/"                element={<Layout><Home /></Layout>} />
            <Route path="/events/upcoming" element={<Layout><UpcomingEvents /></Layout>} />
            <Route path="/events/past"     element={<Layout><PastEvents /></Layout>} />
            <Route path="/events/:id"      element={<Layout><EventDetail /></Layout>} />

            {/* Create event reachable by everyone — page itself prompts sign-in */}
            <Route path="/events/create"   element={<Layout><CreateEvent /></Layout>} />

            {/* Editing always requires auth */}
            <Route path="/events/:id/edit" element={
              <ProtectedRoute><Layout><EditEvent /></Layout></ProtectedRoute>
            } />

            {/* User dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/profile"           element={<Navigate to="/dashboard?tab=profile" replace />} />
            <Route path="/dashboard/profile" element={<Navigate to="/dashboard?tab=profile" replace />} />

            {/* Admin */}
            <Route path="/admin" element={
              <AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
