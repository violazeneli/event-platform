import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  User, LogOut, Shield, ChevronDown, LogIn, UserPlus,
  LayoutDashboard, PlusCircle, Calendar, Clock, Home as HomeIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../ui/BrandLogo'
import Avatar from '../ui/Avatar'
import toast from 'react-hot-toast'

/**
 * Top navigation — three top-level items: Home, Events ▾, Profile.
 * The Events item opens a dropdown listing Past, Upcoming and Create.
 *
 * Everything sits on a single horizontal row.
 */
export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isEventsOpen,  setIsEventsOpen]  = useState(false)
  const profileRef = useRef(null)
  const eventsRef  = useRef(null)
  const { user, profile, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Close any open menu when the route changes
  useEffect(() => {
    setIsProfileOpen(false)
    setIsEventsOpen(false)
  }, [location.pathname])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false)
      if (eventsRef.current  && !eventsRef.current.contains(e.target))  setIsEventsOpen(false)
    }
    if (isProfileOpen || isEventsOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isProfileOpen, isEventsOpen])

  const handleSignOut = async () => {
    // Close the dropdown + navigate + toast immediately so the UI feels
    // instant. signOut() clears local state synchronously before awaiting
    // the network round-trip, so the navbar updates right away.
    setIsProfileOpen(false)
    navigate('/')
    toast.success('Signed out')
    try {
      await signOut()
    } catch {
      // Local state already cleared; nothing actionable for the user.
    }
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const eventsActive = location.pathname.startsWith('/events')

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/95">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <BrandLogo size="md" />
          </Link>

          {/* Center nav (Home + Events dropdown) */}
          <nav className="flex items-center gap-1.5">
            <Link
              to="/"
              className={`
                inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium
                transition-colors whitespace-nowrap
                ${isActive('/')
                  ? 'text-white bg-gradient-to-r from-pink-500/30 to-purple-500/20 border border-pink-400/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <HomeIcon size={14} className="hidden xs:inline" />
              Home
            </Link>

            {/* Events dropdown */}
            <div className="relative" ref={eventsRef}>
              <button
                onClick={() => setIsEventsOpen(!isEventsOpen)}
                className={`
                  inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium
                  transition-colors whitespace-nowrap
                  ${(eventsActive || isEventsOpen)
                    ? 'text-white bg-gradient-to-r from-pink-500/30 to-purple-500/20 border border-pink-400/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <Calendar size={14} className="hidden xs:inline" />
                Events
                <ChevronDown size={13} className={`transition-transform ${isEventsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isEventsOpen && (
                /*
                  Anchored to the LEFT edge of the trigger button so the
                  dropdown opens to the right and stays within the page —
                  centered positioning was overflowing on narrower windows.
                  Width is also smaller (w-52 = 208px) to fit comfortably.
                */
                <div className="absolute left-0 top-full mt-2 w-52 max-w-[calc(100vw-1rem)] rounded-2xl bg-ink-700 border border-white/10 shadow-2xl overflow-hidden animate-scale-in origin-top-left z-50">
                  <div className="p-1.5">
                    <DropItem
                      to="/events/upcoming"
                      icon={Calendar}
                      label="Upcoming"
                      active={isActive('/events/upcoming')}
                    />
                    <DropItem
                      to="/events/past"
                      icon={Clock}
                      label="Past Events"
                      active={isActive('/events/past')}
                    />
                    <div className="my-1 border-t border-white/5" />
                    <DropItem
                      to="/events/create"
                      icon={PlusCircle}
                      label="Create Event"
                      active={isActive('/events/create')}
                      highlighted
                    />
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Profile */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl border transition-colors ${
                isProfileOpen
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {user ? (
                <>
                  <Avatar url={profile?.avatar_url} name={profile?.name} email={user.email} size="sm" square />
                  <span className="hidden xs:inline text-sm text-gray-100 max-w-[7rem] truncate font-medium">
                    {profile?.name || 'Profile'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
                    <User size={14} className="text-gray-200" />
                  </span>
                  <span className="hidden xs:inline text-sm text-gray-100 font-medium">Profile</span>
                </>
              )}
              <ChevronDown size={13} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-ink-700 border border-white/10 shadow-2xl overflow-hidden animate-scale-in origin-top-right z-50">
                {user ? (
                  <>
                    <div className="p-4 border-b border-white/10 bg-gradient-to-br from-pink-600/15 to-purple-600/10">
                      <p className="text-[10px] uppercase tracking-widest text-pink-300/80 font-bold">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate mt-0.5">{profile?.name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-bold tracking-wider uppercase border border-amber-500/30">
                          <Shield size={10} /> Administrator
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <SimpleItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                      <SimpleItem to="/dashboard?tab=profile" icon={User} label="My Profile" />
                      <SimpleItem to="/events/create" icon={PlusCircle} label="Create Event" />
                      {isAdmin && (
                        <SimpleItem to="/admin" icon={Shield} label="Admin Panel" highlighted />
                      )}
                      <div className="my-1 border-t border-white/5" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-2">
                    <SimpleItem to="/signin" icon={LogIn}    label="Sign In" />
                    <SimpleItem to="/signup" icon={UserPlus} label="Create Account" highlighted />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─── Dropdown items ─── */

function DropItem({ to, icon: Icon, label, active, highlighted = false }) {
  const tone = active
    ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/15 text-white border-pink-400/25'
    : highlighted
      ? 'text-pink-200 hover:bg-pink-500/10 border-transparent'
      : 'text-gray-200 hover:text-white hover:bg-white/5 border-transparent'

  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors border ${tone}`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SimpleItem({ to, icon: Icon, label, highlighted = false }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        highlighted
          ? 'text-pink-200 bg-pink-500/10 hover:bg-pink-500/20'
          : 'text-gray-200 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon size={14} /> {label}
    </Link>
  )
}
