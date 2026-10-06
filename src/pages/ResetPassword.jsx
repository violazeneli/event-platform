import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import BrandLogo from '../components/ui/BrandLogo'

/**
 * /reset-password — landing page after the user clicks a password-recovery
 * link. By the time they're here, AuthCallback has already exchanged the
 * code for a session, so they're authenticated. We just collect the new
 * password and call updateUser().
 *
 * If somehow they reach this URL without a session, kick them back to
 * /forgot-password.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [show, setShow] = useState(false)
  const [pw, setPw] = useState({ new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  // If they got here without a recovery session, send them to forgot-password
  useEffect(() => {
    if (!loading && !user) navigate('/forgot-password', { replace: true })
  }, [loading, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (pw.new.length < 6)         return setError('Password must be at least 6 characters.')
    if (pw.new !== pw.confirm)     return setError('Passwords do not match.')
    try {
      setSaving(true)
      await authService.updatePassword(pw.new)
      setDone(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    } catch (err) {
      setError(err.message || 'Could not update password. Try again.')
    } finally {
      setSaving(false)
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
            {done ? 'Password updated' : 'Set a new password'}
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            {done
              ? 'You\'re all set. Taking you to your dashboard…'
              : 'Pick a strong password — at least 6 characters.'}
          </p>
        </div>

        <div className="panel p-7">
          {done ? (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">Your password has been changed.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <Input
                label="New password"
                type={show ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={pw.new}
                onChange={(e) => setPw(p => ({ ...p, new: e.target.value }))}
                leftIcon={<Lock size={15} />}
                rightIcon={
                  <button type="button" onClick={() => setShow(!show)} className="hover:text-white transition-colors">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                autoFocus
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="Repeat password"
                value={pw.confirm}
                onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))}
                leftIcon={<Lock size={15} />}
              />

              <Button type="submit" loading={saving} className="w-full" size="lg" rightIcon={!saving && <ArrowRight size={16} />}>
                {saving ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
