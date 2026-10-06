import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, AlertCircle,
  Camera, FileText, X, Send, Info,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { storageService } from '../services/storageService'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'
import BrandLogo from '../components/ui/BrandLogo'
import Avatar from '../components/ui/Avatar'
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '../utils/constants'
import toast from 'react-hot-toast'

/**
 * Map a Supabase auth error to friendly text + keep the raw for debugging.
 */
function friendlySignupError(rawMessage = '') {
  const m = rawMessage.toLowerCase()
  let friendly
  if (m.includes('already') || m.includes('exists'))
    friendly = 'An account with this email already exists. Try signing in instead.'
  else if (m.includes('password') && m.includes('weak'))
    friendly = 'Password is too weak — try something longer.'
  else if (m.includes('rate') || m.includes('over_email_send_rate_limit'))
    friendly = 'Supabase is rate-limiting sign-ups (free-tier limit is 4/hour). Wait an hour and try again — or check that "Confirm email" is OFF in Supabase, since the rate limit is mostly on outgoing emails.'
  else if (m.includes('relation') && m.includes('profiles'))
    friendly = 'The "profiles" table is missing in your Supabase project. Run the SQL setup from SETUP.md.'
  else if (m.includes('email signups are disabled') || m.includes('signups not allowed'))
    friendly = 'Email sign-ups are disabled in Supabase. Go to Auth → Providers → Email and turn the provider ON (keep "Confirm email" OFF).'
  else if (m.includes('load failed') || m.includes('failed to fetch') || m.includes('network'))
    friendly = 'Browser could not reach Supabase. Restart the dev server, then try again.'
  else
    friendly = rawMessage || 'Could not create your account. Please try again.'
  return { friendly, raw: rawMessage }
}

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const fileRef = useRef(null)

  const [loading, setLoading]   = useState(false)
  const [showPassword, setShow] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [errors, setErrors]     = useState({})
  const [authError, setAuthError] = useState(null)

  // We only show the "check your email" panel if Supabase actually requires
  // confirmation (i.e. signUp returned no session). With "Confirm email" off
  // this branch never triggers and users go straight to /dashboard.
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resending, setResending] = useState(false)
  const [resentAt, setResentAt] = useState(null)

  const avatarPreviewUrl = avatarFile ? URL.createObjectURL(avatarFile) : null

  const handlePickAvatar = (file) => {
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return toast.error('Use JPG, PNG, or WebP for the avatar.')
    }
    if (file.size > MAX_FILE_SIZE) {
      return toast.error('Avatar must be smaller than 5 MB.')
    }
    setAvatarFile(file)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email)       e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)              e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (form.bio.length > 280) e.bio = 'Bio must be 280 characters or less'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError(null)
    if (!validate()) return
    try {
      setLoading(true)

      // 1) Create the auth user — the DB trigger inserts a profile row
      const result = await signUp({
        email: form.email,
        password: form.password,
        name: form.name.trim(),
      })

      // If email confirmation is on, no session is returned and we stop here
      if (!result?.session) {
        setNeedsConfirm(true)
        toast.success('Account created — check your email to confirm.')
        return
      }

      // 2) Now we have a logged-in user — flesh out the profile with bio + avatar
      const userId = result.user.id
      const updates = {}
      if (form.bio.trim()) updates.bio = form.bio.trim()

      try {
        if (avatarFile) {
          const url = await storageService.uploadAvatar(avatarFile, userId)
          updates.avatar_url = url
        }
        if (Object.keys(updates).length) {
          await userService.updateProfile(userId, updates)
        }
      } catch (err) {
        // Profile-extra failures are non-fatal — the user is signed up either way.
        console.warn('[SignUp] saving extra profile fields failed:', err)
      }

      toast.success('Welcome to Eventify')
      navigate('/dashboard')
    } catch (err) {
      console.error('[SignUp] supabase.signUp failed:', err)
      setAuthError(friendlySignupError(err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex"><BrandLogo size="lg" /></Link>
          <h1 className="font-display text-2xl font-black text-white mt-5">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Free forever — set up everything in one go.</p>
        </div>

        <div className="panel p-7 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

          {needsConfirm ? (
            /* ── Email-confirmation success view ── */
            <div className="space-y-4 relative">
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
                <Check size={16} className="shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold mb-1">Account created!</p>
                  <p className="text-emerald-200/90">
                    We've sent a confirmation link to <span className="text-white">{form.email}</span>. Click the link, then sign in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs">
                <Info size={13} className="text-pink-300 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="text-white">Don't want this step?</span> In Supabase →
                  <em className="text-white"> Authentication → Providers → Email</em> →
                  un-toggle "Confirm email".
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/signin" className="btn-pink w-full">
                  Go to Sign In <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  className="btn-ghost w-full"
                  disabled={resending}
                  onClick={async () => {
                    try {
                      setResending(true)
                      await authService.resendConfirmation(form.email)
                      setResentAt(Date.now())
                      toast.success('Confirmation email sent again')
                    } catch (err) {
                      toast.error(err.message || 'Could not resend the email')
                    } finally {
                      setResending(false)
                    }
                  }}
                >
                  <Send size={14} />
                  {resending ? 'Sending…' : resentAt ? 'Resend again' : "Didn't get it? Resend"}
                </button>
              </div>
            </div>
          ) : (
            /* ── Sign up form ── */
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

              {/* Avatar picker */}
              <div className="flex items-center gap-4 pb-2">
                <Avatar
                  url={avatarPreviewUrl}
                  name={form.name}
                  email={form.email}
                  size="lg"
                  square
                />
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Profile photo</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={(e) => handlePickAvatar(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="btn-ghost text-xs"
                    >
                      <Camera size={12} /> {avatarFile ? 'Change' : 'Upload'}
                    </button>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
                      >
                        <X size={11} /> Remove
                      </button>
                    )}
                    <span className="text-[11px] text-gray-500">Optional · JPG / PNG / WebP · &lt; 5 MB</span>
                  </div>
                </div>
              </div>

              <Input
                label="Full name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange('name')}
                error={errors.name}
                leftIcon={<User size={15} />}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
                error={errors.email}
                leftIcon={<Mail size={15} />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                  error={errors.password}
                  leftIcon={<Lock size={15} />}
                  rightIcon={
                    <button type="button" onClick={() => setShow(!showPassword)} className="hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <Input
                  label="Confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={errors.confirmPassword}
                  leftIcon={<Lock size={15} />}
                />
              </div>

              <Textarea
                label="Bio (optional)"
                rows={2}
                placeholder="A few words about yourself"
                value={form.bio}
                onChange={handleChange('bio')}
                error={errors.bio}
                helperText={form.bio ? `${form.bio.length}/280` : 'Up to 280 characters — appears on your profile and events.'}
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
                rightIcon={!loading && <ArrowRight size={16} />}
                leftIcon={!loading && <FileText size={15} />}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>

              <ul className="grid grid-cols-2 gap-2">
                {['Free forever', 'No credit card', 'Unlimited events', 'Cancel anytime'].map(b => (
                  <li key={b} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Check size={12} className="text-pink-400 shrink-0" /> {b}
                  </li>
                ))}
              </ul>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-ink-700 px-3 text-xs text-gray-500">Already have an account?</span>
                </div>
              </div>

              <Link to="/signin" className="btn-ghost w-full">Sign in</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
