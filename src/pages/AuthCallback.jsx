import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { userService } from '../services/userService'
import BrandLogo from '../components/ui/BrandLogo'
import toast from 'react-hot-toast'

/**
 * /auth/callback
 *
 * Landing page for every email-link auth flow Supabase supports:
 *   • signup confirmation       (?code=… or #access_token=…)
 *   • magic-link sign-in        (rare — same shape as signup)
 *   • password recovery         (type=recovery)
 *   • email change confirmation (type=email_change)
 *   • invite acceptance         (type=invite)
 *
 * For each, we exchange the URL params for a session, then route the user
 * to a sensible page with a friendly toast.
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState({ kind: 'loading', message: 'Confirming your link…' })

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      try {
        const url = new URL(window.location.href)
        const hash = new URLSearchParams(window.location.hash.slice(1))

        const code      = url.searchParams.get('code')
        const errorDesc = url.searchParams.get('error_description') || hash.get('error_description')
        const type      = url.searchParams.get('type') || hash.get('type')

        if (errorDesc) throw new Error(errorDesc)

        // PKCE: trade ?code= for a session
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        // Implicit: supabase-js auto-handles #access_token when detectSessionInUrl is true
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          if (!cancelled) {
            setStatus({
              kind: 'error',
              message: 'This link is no longer valid. It may have already been used or expired.',
            })
            setTimeout(() => navigate('/signin', { replace: true }), 2500)
          }
          return
        }

        // Look up the role so admins go to the admin panel
        let role = 'user'
        try {
          const profile = await userService.getProfile(session.user.id)
          role = profile?.role || 'user'
        } catch {
          // The trigger usually creates the profile, but if for some reason it
          // hasn't yet, just default to user — a refresh will pick it up.
        }

        if (cancelled) return

        // Pick a destination + success toast based on the flow
        let destination
        let toastMessage

        if (type === 'recovery') {
          destination  = '/reset-password'
          toastMessage = null /* page itself shows the form */
        } else if (type === 'email_change') {
          destination  = '/dashboard?tab=profile'
          toastMessage = 'Email address updated.'
        } else if (type === 'invite') {
          destination  = '/dashboard?tab=profile'
          toastMessage = 'Welcome — finish setting up your profile.'
        } else if (type === 'signup' || type === 'email') {
          destination  = role === 'admin' ? '/admin' : '/dashboard'
          toastMessage = 'Email confirmed. Welcome!'
        } else {
          destination  = role === 'admin' ? '/admin' : '/dashboard'
          toastMessage = null
        }

        setStatus({ kind: 'ok', message: 'You\'re in. Redirecting…' })
        if (toastMessage) toast.success(toastMessage)

        // Strip code/hash from URL before navigating so the next page is clean
        window.history.replaceState({}, '', '/auth/callback')
        setTimeout(() => navigate(destination, { replace: true }), 500)
      } catch (err) {
        if (cancelled) return
        setStatus({
          kind: 'error',
          message: err.message || 'Something went wrong while confirming your account.',
        })
        setTimeout(() => navigate('/signin', { replace: true }), 2500)
      }
    }

    finish()
    return () => { cancelled = true }
  }, [navigate])

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-purple-600/12 rounded-full blur-3xl" />
      </div>

      <div className="relative panel p-8 max-w-sm w-full text-center animate-scale-in">
        <div className="flex justify-center mb-5"><BrandLogo size="md" /></div>

        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          status.kind === 'ok'    ? 'bg-emerald-500/15 text-emerald-300' :
          status.kind === 'error' ? 'bg-red-500/15 text-red-300' :
                                    'bg-pink-500/10 text-pink-300'
        }`}>
          {status.kind === 'ok'    ? <CheckCircle2 size={26} /> :
           status.kind === 'error' ? <AlertCircle  size={26} /> :
                                     <Loader2 size={26} className="animate-spin" />}
        </div>

        <h1 className="font-display text-xl font-bold text-white mb-1.5">
          {status.kind === 'ok'    ? 'All set!' :
           status.kind === 'error' ? 'Something went wrong' :
                                     'Just a moment…'}
        </h1>
        <p className="text-gray-400 text-sm">{status.message}</p>
      </div>
    </div>
  )
}
