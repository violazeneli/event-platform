import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import BrandLogo from '../components/ui/BrandLogo'
import toast from 'react-hot-toast'

/** Map a Supabase auth error to friendly text + keep the raw for debugging. */
function friendlyAuthError(rawMessage = '') {
  const m = rawMessage.toLowerCase()
  let friendly
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    friendly = 'That email and password don\'t match. Double-check and try again.'
  else if (m.includes('email not confirmed'))
    friendly = 'Your email is not confirmed yet. Check your inbox for a confirmation link, or disable email confirmation in your Supabase project (Auth → Providers → Email).'
  else if (m.includes('user not found'))
    friendly = 'No account exists for that email. Sign up first.'
  else if (m.includes('rate'))
    friendly = 'Too many attempts. Wait a moment and try again.'
  else if (m.includes('load failed') || m.includes('failed to fetch') || m.includes('network'))
    friendly = 'Browser could not reach Supabase. Likely causes: dev server still running an old .env (restart it), browser cache, or a browser extension. Technical details below.'
  else
    friendly = rawMessage || 'Something went wrong. Please try again.'
  return { friendly, raw: rawMessage }
}

export default function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState(null)

  const from = location.state?.from?.pathname || null

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError(null)
    if (!validate()) return
    try {
      setLoading(true)
      const result = await signIn({ email: form.email, password: form.password })
      const isAdmin = result?.profile?.role === 'admin'
      const destination = from ? from : (isAdmin ? '/admin' : '/dashboard')
      toast.success(isAdmin ? 'Welcome back, Admin' : 'Welcome back')
      navigate(destination, { replace: true })
    } catch (err) {
      console.error('[SignIn] supabase.signIn failed:', err)
      setAuthError(friendlyAuthError(err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex"><BrandLogo size="lg" /></Link>
          <h1 className="font-display text-2xl font-black text-white mt-5">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account to continue.</p>
        </div>

        <div className="panel p-7 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-pink-600/10 blur-3xl" />

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError.friendly}</span>
                </div>
                {authError.raw && authError.raw !== authError.friendly && (
                  <details className="mt-2 ml-6 text-red-300/80">
                    <summary className="cursor-pointer hover:text-red-200">Technical details</summary>
                    <pre className="mt-1.5 p-2 rounded bg-black/30 text-[11px] whitespace-pre-wrap break-words">{authError.raw}</pre>
                  </details>
                )}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              error={errors.email}
              leftIcon={<Mail size={15} />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              error={errors.password}
              leftIcon={<Lock size={15} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              autoComplete="current-password"
            />

            {/* Forgot-password is intentionally not shown — this project skips
                email-based recovery to avoid Supabase's free-tier rate limits.
                Users can delete + recreate their account from the dashboard
                if they get locked out. */}
            <Button type="submit" loading={loading} className="w-full" size="lg" rightIcon={!loading && <ArrowRight size={16} />}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5">
            <Shield size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Sign in with an admin account to land on the
              <span className="text-amber-300 font-semibold"> Admin Panel</span> automatically.
            </p>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center">
              <span className="bg-ink-700 px-3 text-xs text-gray-500">No account yet?</span>
            </div>
          </div>

          <Link to="/signup" className="btn-ghost w-full">Create account</Link>
        </div>
      </div>
    </div>
  )
}
