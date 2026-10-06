import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import BrandLogo from '../components/ui/BrandLogo'

/**
 * /forgot-password — small form, one input, one button. After submit we
 * always show the same "if that email exists, we sent a link" message
 * regardless of whether the email was registered (good practice — don't
 * leak whether an email is in the system).
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return setError('Enter your email address.')
    try {
      setLoading(true)
      await authService.resetPasswordForEmail(email.trim())
      setSent(true)
    } catch (err) {
      const m = (err.message || '').toLowerCase()
      if (m.includes('rate'))
        setError('Too many attempts. Wait a moment and try again.')
      else if (m.includes('load failed') || m.includes('failed to fetch'))
        setError('Could not reach Supabase. Check the red banner at the top.')
      else
        setError(err.message || 'Could not send the reset email. Try again.')
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
          <h1 className="font-display text-2xl font-black text-white mt-5">
            {sent ? 'Check your inbox' : 'Forgot your password?'}
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            {sent
              ? 'We just sent a reset link.'
              : "No worries — enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div className="panel p-7">
          {sent ? (
            <div className="space-y-5">
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold">Email sent</p>
                  <p className="text-emerald-200/90 mt-0.5">
                    If <span className="text-white">{email}</span> belongs to an account, a reset link is on its way. Click it to set a new password.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Didn't receive it? Check your spam folder, or wait a minute and{' '}
                <button
                  className="text-pink-300 hover:text-pink-200 underline"
                  onClick={() => { setSent(false); setError(null) }}
                >
                  try again
                </button>.
              </p>

              <Link to="/signin" className="btn-ghost w-full">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={15} />}
                autoComplete="email"
                autoFocus
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>

              <Link to="/signin" className="btn-ghost w-full">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
