import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import { checkSupabaseConnection } from '../../services/supabase'

/**
 * One-time connectivity probe at first paint. Result is cached in memory so
 * subsequent re-mounts don't fire another network request — without this the
 * banner kept firing on every navigation and slowing the page down.
 *
 * Renders nothing when Supabase is reachable.
 */

// Module-level cache: survives StrictMode double-mount, re-renders, route
// changes within the same tab.
let cachedStatus = null
let inFlight = null

async function runCheck(force = false) {
  if (!force && cachedStatus) return cachedStatus
  if (!force && inFlight) return inFlight
  inFlight = checkSupabaseConnection().then(res => {
    cachedStatus = res
    inFlight = null
    return res
  })
  return inFlight
}

export default function ConnectionGuard() {
  const [status, setStatus]     = useState(cachedStatus ?? { ok: true })
  const [checking, setChecking] = useState(!cachedStatus)
  const didRun = useRef(false)

  const run = async (force = false) => {
    setChecking(true)
    const result = await runCheck(force)
    setStatus(result)
    setChecking(false)
  }

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    if (!cachedStatus) run(false)
  }, [])

  if (checking || status.ok) return null

  return (
    <div className="sticky top-0 z-50 bg-red-500/95 text-white text-sm shadow-2xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8 py-3 flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Cannot connect to Supabase</p>
          <p className="text-white/90 text-xs mt-0.5 leading-relaxed break-words">
            {status.message}
          </p>
          {status.reason === 'paused' && (
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-white underline text-xs hover:text-white/80"
            >
              Open Supabase dashboard <ExternalLink size={11} />
            </a>
          )}
        </div>
        <button
          onClick={() => run(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
          title="Try again"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    </div>
  )
}
