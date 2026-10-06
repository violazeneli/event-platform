import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  LayoutDashboard, User, CalendarDays, Compass, Edit3, Save, X,
  Trash2, Key, Mail, ShieldAlert, PlusCircle, Filter,
} from 'lucide-react'
import SidebarShell from '../components/layout/SidebarShell'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
import { eventService } from '../services/eventService'
import { storageService } from '../services/storageService'
import EventCard from '../components/events/EventCard'
import { CardSkeleton } from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'
import Avatar from '../components/ui/Avatar'
import AvatarUploader from '../components/ui/AvatarUploader'
import { EVENT_CATEGORIES } from '../utils/constants'
import { formatShortDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'

/**
 * The user dashboard. Top-level navigation lives in the sticky sidebar.
 * Sections — Overview, Profile, My Events, Browse — are rendered in the
 * main column. Sections share state so switching is instant.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'overview'
  const { user, profile, refreshProfile, signOut, updatePassword } = useAuth()

  const [myEvents, setMyEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [mine, all] = await Promise.all([
          eventService.getByUser(user.id),
          eventService.getUpcoming(),
        ])
        if (cancelled) return
        setMyEvents(mine)
        setAllEvents(all.slice(0, 9))
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const upcoming = useMemo(
    () => myEvents.filter(e => new Date(e.date) >= new Date(new Date().toDateString())),
    [myEvents],
  )
  const past = useMemo(
    () => myEvents.filter(e => new Date(e.date) <  new Date(new Date().toDateString())),
    [myEvents],
  )

  const sections = [
    { id: 'overview', label: 'Overview',  icon: LayoutDashboard },
    { id: 'profile',  label: 'My Profile', icon: User },
    { id: 'events',   label: 'My Events', icon: CalendarDays, badge: myEvents.length || null },
    { id: 'browse',   label: 'Browse',    icon: Compass },
  ]

  const setTab = (id) => setParams(id === 'overview' ? {} : { tab: id })

  const sidebar = (
    <>
      <div className="mb-4 pb-4 border-b border-white/5">
        <p className="eyebrow mb-1"><LayoutDashboard size={11} /> Your account</p>
        <h2 className="font-display text-lg font-bold text-white truncate">
          {profile?.name || user?.email?.split('@')[0]}
        </h2>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
      </div>
      <nav className="space-y-1">
        {sections.map(s => {
          const Icon = s.icon
          const active = tab === s.id
          return (
            <button
              key={s.id}
              onClick={() => setTab(s.id)}
              className={`side-link ${active ? 'side-link-active' : ''}`}
            >
              <Icon size={15} />
              <span className="flex-1 text-left">{s.label}</span>
              {s.badge != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {s.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="mt-5 pt-4 border-t border-white/5 space-y-1">
        <Link to="/events/create" className="side-link text-pink-200 hover:text-pink-100 hover:bg-pink-500/10">
          <PlusCircle size={15} />
          <span className="flex-1 text-left">Create event</span>
        </Link>
        <button
          onClick={async () => { await signOut(); navigate('/') }}
          className="side-link text-red-300 hover:text-red-200 hover:bg-red-500/10"
        >
          <ShieldAlert size={15} />
          <span className="flex-1 text-left">Sign out</span>
        </button>
      </div>
    </>
  )

  return (
    <SidebarShell sidebar={sidebar}>
      {tab === 'overview' && (
        <Overview user={user} profile={profile} myEvents={myEvents} upcoming={upcoming} past={past} loading={loading} setTab={setTab} />
      )}
      {tab === 'profile' && (
        <ProfileSection
          user={user}
          profile={profile}
          refreshProfile={refreshProfile}
          updatePassword={updatePassword}
        />
      )}
      {tab === 'events' && (
        <MyEventsSection myEvents={myEvents} setMyEvents={setMyEvents} loading={loading} />
      )}
      {tab === 'browse' && (
        <BrowseSection events={allEvents} loading={loading} />
      )}
    </SidebarShell>
  )
}

/* ─── Overview ─── */
function Overview({ user, profile, myEvents, upcoming, past, loading, setTab }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2"><LayoutDashboard size={11} /> Dashboard</p>
        <h1 className="font-display text-3xl lg:text-4xl font-black text-white">
          Welcome back, <span className="gradient-text">{profile?.name?.split(' ')[0] || 'there'}</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">Here's a quick look at what you've got going on.</p>
      </header>

      {/* Identity card — surfaces every profile field at a glance */}
      <div className="panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar
          url={profile?.avatar_url}
          name={profile?.name}
          email={user?.email}
          size="lg"
          square
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-xl font-bold text-white truncate">
              {profile?.name || 'No name set'}
            </h2>
            {profile?.role === 'admin' && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                Admin
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Mail size={12} className="text-pink-300" /> {user?.email}
          </p>
          {profile?.bio
            ? <p className="text-gray-300 text-sm mt-2 max-w-2xl line-clamp-2">{profile.bio}</p>
            : <p className="text-gray-600 text-xs italic mt-2">No bio yet — add one in your profile.</p>
          }
          <p className="text-gray-600 text-[11px] mt-2">
            Joined {profile?.created_at ? formatShortDate(profile.created_at) : '—'}
          </p>
        </div>
        <button
          onClick={() => setTab('profile')}
          className="btn-ghost text-xs shrink-0"
        >
          <Edit3 size={12} /> Edit profile
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Total events"  value={myEvents.length} />
        <StatTile label="Upcoming"      value={upcoming.length} accent="text-pink-300" />
        <StatTile label="Past"          value={past.length}     muted />
      </div>

      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-white">Recent activity</h2>
          <button onClick={() => setTab('events')} className="text-xs text-pink-300 hover:text-pink-200">
            See all →
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading…</p>
        ) : myEvents.length === 0 ? (
          <EmptyState
            title="You haven't created any events yet"
            body="Spin up your first event in under a minute."
            ctaLabel="Create your first event"
            ctaTo="/events/create"
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {myEvents.slice(0, 5).map(e => (
              <li key={e.id} className="py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-base">
                  📅
                </span>
                <div className="flex-1 min-w-0">
                  <Link to={`/events/${e.id}`} className="text-sm font-semibold text-white hover:text-pink-200 truncate block">
                    {e.title}
                  </Link>
                  <p className="text-xs text-gray-500">{formatShortDate(e.date)} · {e.location}</p>
                </div>
                <Link to={`/events/${e.id}/edit`} className="text-xs text-gray-400 hover:text-pink-300">Edit</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ─── Profile editor ─── */
function ProfileSection({ user, profile, refreshProfile, updatePassword }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', bio: profile.bio || '' })
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name cannot be empty')
    try {
      setSaving(true)
      await userService.updateProfile(user.id, {
        name: form.name.trim(),
        bio: form.bio.trim() || null,
      })
      await refreshProfile()
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match')
    try {
      setSavingPw(true)
      await updatePassword(pwForm.newPassword)
      setPwModal(false)
      setPwForm({ newPassword: '', confirmPassword: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setSavingPw(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await userService.deleteOwnAccount(user.id)
      toast.success('Account deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail))
      return toast.error('Enter a valid email')
    if (newEmail.trim().toLowerCase() === user.email?.toLowerCase())
      return toast.error('That\'s already your email.')
    try {
      setSavingEmail(true)
      await authService.updateEmail(newEmail.trim())
      setEmailSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to start email change')
    } finally {
      setSavingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2"><User size={11} /> Profile</p>
        <h1 className="font-display text-3xl font-black text-white">My profile</h1>
        <p className="text-gray-400 text-sm mt-1.5">Update how you appear across Eventify.</p>
      </header>

      {/* Avatar editor */}
      <div className="panel p-6 space-y-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profile photo</h3>
        <AvatarUploader user={user} profile={profile} onChange={refreshProfile} />
      </div>

      {/* Identity summary */}
      <div className="panel p-6 flex items-center gap-4">
        <Avatar url={profile?.avatar_url} name={profile?.name} email={user?.email} size="lg" square />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-white truncate">{profile?.name || 'No name set'}</h2>
          <p className="text-gray-400 text-sm flex items-center gap-1.5"><Mail size={12} /> {user?.email}</p>
          <p className="text-gray-600 text-xs mt-0.5">Joined {profile?.created_at ? formatShortDate(profile.created_at) : '—'}</p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="panel p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">Personal details</h3>
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Your full name"
        />
        <Textarea
          label="Bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))}
          placeholder="A few words about yourself (optional)"
        />
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn-pink" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => setPwModal(true)} className="btn-ghost">
            <Key size={14} /> Change password
          </button>
          {/* Change email is intentionally hidden — this project doesn't use
              the Supabase email service. If a user really needs a new email,
              they can delete their account and sign up again. */}
        </div>
      </form>

      <p className="text-xs text-gray-500 -mt-3 ml-1">
        Forgot your password? You can delete your account from the
        <span className="text-red-300"> danger zone</span> below and sign up again with the same email.
      </p>

      {/* Danger zone */}
      <div className="panel p-6 border-red-500/30 bg-gradient-to-br from-red-500/[0.04] to-transparent" style={{ borderColor: 'rgba(248, 113, 113, 0.25)' }}>
        <h3 className="text-sm font-bold text-red-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ShieldAlert size={13} /> Danger zone
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Deleting your account is permanent. All events you've created will also be removed.
        </p>
        <button onClick={() => setConfirmDelete(true)} className="btn-danger">
          <Trash2 size={14} /> Delete my account
        </button>
      </div>

      {/* Modals */}
      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="Change password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="New password"
            type="password"
            placeholder="At least 6 characters"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="Repeat your password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setPwModal(false)}>Cancel</button>
            <Button type="submit" loading={savingPw}>Update password</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={emailModal} onClose={() => setEmailModal(false)} title="Change email">
        {emailSent ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              Confirmation links sent — check both <span className="text-white">{user?.email}</span> AND <span className="text-white">{newEmail}</span>.
              Your email won't change until both links are clicked.
            </p>
            <p className="text-gray-500 text-xs">
              This double-confirmation is Supabase's "Secure email change" — protects you in case someone takes over your inbox briefly.
            </p>
            <div className="flex justify-end pt-2">
              <button className="btn-pink" onClick={() => setEmailModal(false)}>Got it</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <p className="text-xs text-gray-400">
              Current email: <span className="text-white font-medium">{user?.email}</span>
            </p>
            <Input
              label="New email"
              type="email"
              placeholder="new@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              leftIcon={<Mail size={15} />}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setEmailModal(false)}>Cancel</button>
              <Button type="submit" loading={savingEmail}>Send confirmation</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete account?">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            This action <span className="text-red-300 font-semibold">cannot be undone</span>. Your profile and all of your events will be permanently removed.
          </p>
          <p className="text-gray-500 text-xs">Note: your sign-in record stays on the auth side; your data on the platform is fully deleted.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Yes, delete my account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── My Events with filters ─── */
function MyEventsSection({ myEvents, setMyEvents, loading }) {
  const [status, setStatus]   = useState('all') // all | upcoming | past
  const [category, setCategory] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const today = new Date(new Date().toDateString())
    return myEvents
      .filter(e => {
        if (status === 'upcoming') return new Date(e.date) >= today
        if (status === 'past')     return new Date(e.date) <  today
        return true
      })
      .filter(e => category === 'all' || e.category === category)
  }, [myEvents, status, category])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      setDeleting(true)
      if (confirmDelete.images?.length) {
        await storageService.deleteMultiple(confirmDelete.images)
      }
      await eventService.delete(confirmDelete.id)
      setMyEvents(prev => prev.filter(e => e.id !== confirmDelete.id))
      setConfirmDelete(null)
      toast.success('Event deleted')
    } catch {
      toast.error('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2"><CalendarDays size={11} /> Your events</p>
          <h1 className="font-display text-3xl font-black text-white">My events</h1>
          <p className="text-gray-400 text-sm mt-1.5">Edit, delete, or share what you've built.</p>
        </div>
        <Link to="/events/create" className="btn-pink">
          <PlusCircle size={14} /> New event
        </Link>
      </header>

      {/* Inline filters */}
      <div className="panel p-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5">
          <Filter size={11} /> Filter
        </span>
        <Pill active={status === 'all'}      onClick={() => setStatus('all')}>All</Pill>
        <Pill active={status === 'upcoming'} onClick={() => setStatus('upcoming')}>Upcoming</Pill>
        <Pill active={status === 'past'}     onClick={() => setStatus('past')}>Past</Pill>
        <span className="w-px h-5 bg-white/10 mx-1" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-ink-700 text-sm text-white px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-pink-400/50"
        >
          {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-500">{filtered.length} of {myEvents.length}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={myEvents.length === 0 ? "You haven't created any events yet" : 'Nothing matches those filters'}
          body={myEvents.length === 0 ? 'Create your first event in under a minute.' : 'Try clearing the filter to see more.'}
          ctaLabel={myEvents.length === 0 ? 'Create your first event' : null}
          ctaTo={myEvents.length === 0 ? '/events/create' : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(e => (
            <EventCard
              key={e.id}
              event={e}
              showActions
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete event?">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Delete <span className="text-white font-semibold">"{confirmDelete?.title}"</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete event</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── Browse other people's events ─── */
function BrowseSection({ events, loading }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2"><Compass size={11} /> Discover</p>
        <h1 className="font-display text-3xl font-black text-white">Browse events</h1>
        <p className="text-gray-400 text-sm mt-1.5">A peek at what the community is hosting next.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState title="No events to browse" body="Check back soon — new events arrive every day." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map(e => <EventCard key={e.id} event={e} compact />)}
          </div>
          <div className="text-center pt-2">
            <Link to="/events/upcoming" className="btn-ghost inline-flex">
              See all upcoming events →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Helpers ─── */
function StatTile({ label, value, accent = 'text-white', muted = false }) {
  return (
    <div className={`stat-tile ${muted ? 'opacity-80' : ''}`}>
      <div className={`font-display text-3xl font-black ${accent}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/20 text-white border border-pink-400/30'
          : 'bg-white/5 text-gray-300 border border-white/10 hover:border-white/20'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState({ title, body, ctaLabel, ctaTo }) {
  return (
    <div className="panel p-10 text-center">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="font-display text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-5">{body}</p>
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className="btn-pink inline-flex">
          <PlusCircle size={14} /> {ctaLabel}
        </Link>
      )}
    </div>
  )
}
