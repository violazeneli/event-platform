import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

/*
 * Profile is cached in sessionStorage so that:
 *   1. Returning to the tab doesn't trigger a "blank screen + refresh" — we
 *      paint the cached profile immediately, then revalidate in the background.
 *   2. Initial page paint after a navigation has the avatar/name already.
 */
const PROFILE_CACHE_KEY = 'eventify.profile'

function readCachedProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCachedProfile(p) {
  try {
    if (p) sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p))
    else sessionStorage.removeItem(PROFILE_CACHE_KEY)
  } catch { /* ignore quota */ }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(() => readCachedProfile())
  // `loading` is true ONLY during the very first bootstrap. Once we know who
  // the user is, every subsequent re-validation happens silently in the
  // background — that's what kills the "had to refresh after switching tab"
  // bug. Route guards only block during the first paint.
  const [loading, setLoading] = useState(true)

  // Track the user id we already fetched a profile for so duplicate auth
  // events (TOKEN_REFRESHED, INITIAL_SESSION, focus-rehydrate, …) don't
  // re-fire network calls.
  const lastFetchedUserId = useRef(null)

  const fetchProfile = useCallback(async (userId, { silent = false } = {}) => {
    if (!userId) return null
    try {
      const profileData = await userService.getProfile(userId)
      setProfile(profileData)
      writeCachedProfile(profileData)
      lastFetchedUserId.current = userId
      return profileData
    } catch (err) {
      if (!silent) console.error('Error fetching profile:', err)
      // Keep the cached profile on transient errors — better than flashing
      // an empty UI just because the network blipped on tab focus.
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Bootstrap — fast path: if we have a cached profile we can finish loading
    // immediately and revalidate in the background.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        // Always end the loading state first so the UI paints. Profile fetch
        // happens after — guards can rely on cached profile if needed.
        setLoading(false)
        fetchProfile(sessionUser.id, { silent: true })
      } else {
        writeCachedProfile(null)
        setProfile(null)
        setLoading(false)
      }
    })

    // Auth events. The IMPORTANT change: only set `loading: true` on real
    // sign-in / sign-out, never on TOKEN_REFRESHED — that's the spurious
    // event that fires every time you come back to the tab and was causing
    // the entire page to re-mount as a spinner.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        const nextUser = session?.user ?? null
        setUser(nextUser)

        if (event === 'SIGNED_OUT' || !nextUser) {
          setProfile(null)
          writeCachedProfile(null)
          lastFetchedUserId.current = null
          return
        }

        // Token refresh = same user, same profile. Nothing to do.
        if (event === 'TOKEN_REFRESHED' && nextUser.id === lastFetchedUserId.current) {
          return
        }

        // User context changed — refresh profile in background, no spinner.
        fetchProfile(nextUser.id, { silent: true })
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async (credentials) => authService.signUp(credentials)

  // signIn now resolves the profile too, so the caller can route based on role.
  const signIn = async (credentials) => {
    const data = await authService.signIn(credentials)
    let resolvedProfile = null
    if (data?.user?.id) {
      resolvedProfile = await fetchProfile(data.user.id)
    }
    return { ...data, profile: resolvedProfile }
  }

  const signOut = async () => {
    // Optimistic UI — clear the local state first so the navbar updates
    // instantly, then tell Supabase. The user sees the result immediately
    // instead of waiting for a network round-trip.
    setUser(null)
    setProfile(null)
    writeCachedProfile(null)
    lastFetchedUserId.current = null
    try {
      await authService.signOut()
    } catch (err) {
      console.warn('signOut network call failed (state already cleared):', err)
    }
  }

  const updatePassword = async (newPassword) => authService.updatePassword(newPassword)

  const refreshProfile = async () => {
    if (user?.id) return fetchProfile(user.id)
    return null
  }

  // Allow optimistic updates (e.g. after avatar upload) so the UI reflects
  // changes immediately without waiting for a re-fetch.
  const updateProfileLocal = useCallback((patch) => {
    setProfile(prev => {
      const next = prev ? { ...prev, ...patch } : patch
      writeCachedProfile(next)
      return next
    })
  }, [])

  const isAdmin = profile?.role === 'admin'

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updatePassword,
    refreshProfile,
    updateProfileLocal,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
