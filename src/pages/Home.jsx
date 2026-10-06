import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Calendar, Clock, PlusCircle, Sparkles, Users, Globe,
} from 'lucide-react'
import { eventService } from '../services/eventService'
import EventCard from '../components/events/EventCard'
import { CardSkeleton } from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

/**
 * Short, desktop-style welcome page. Fits comfortably in one viewport on a
 * desktop monitor — no infinite scrolling. Two-column hero on the top, a
 * compact "what's next" strip of three featured events below.
 */
export default function Home() {
  const { user, profile } = useAuth()
  const [featured, setFeatured] = useState([])
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [events, s] = await Promise.all([
          eventService.getUpcoming(),
          eventService.getStats(),
        ])
        if (cancelled) return
        setFeatured(events.slice(0, 3))
        setStats(s)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8 py-8 lg:py-12">
      {/* ─── HERO ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        {/* Left — copy */}
        <div className="animate-slide-up">
          <p className="eyebrow mb-4">
            <Sparkles size={12} /> Welcome to Eventify
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.05] text-balance">
            Where{' '}
            <span className="gradient-text">unforgettable</span>{' '}
            moments come to life.
          </h1>
          <p className="text-gray-400 text-base lg:text-lg mt-5 max-w-xl">
            {user
              ? <>Hi <span className="text-white font-semibold">{profile?.name?.split(' ')[0] || 'there'}</span> 👋 — discover what's happening, or share your own event with the world.</>
              : <>Discover concerts, conferences, art shows and more — or host your own. A small, beautiful place for the moments that matter.</>
            }
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link to="/events/upcoming" className="btn-pink">
              Browse Events <ArrowRight size={15} />
            </Link>
            <Link to="/events/create" className="btn-ghost">
              <PlusCircle size={15} /> Create an Event
            </Link>
          </div>

          {/* Inline mini stats */}
          <dl className="flex items-center gap-8 mt-9 text-sm">
            <Stat icon={Calendar} label="Total events"  value={loading ? '—' : stats.total} />
            <Stat icon={Globe}    label="Upcoming"      value={loading ? '—' : stats.upcoming} accent="text-pink-300" />
            <Stat icon={Clock}    label="Past"          value={loading ? '—' : stats.past} />
          </dl>
        </div>

        {/* Right — visual card */}
        <div className="relative animate-fade-in">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-pink-500/30 via-fuchsia-500/20 to-purple-500/30 blur-2xl" />
          <div className="relative panel-strong p-7 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-pink-500/30 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-purple-500/25 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-300/80 mb-2">
                <Sparkles size={12} /> Tonight on Eventify
              </div>
              <h3 className="font-display text-2xl font-black text-white">A community of creators.</h3>
              <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                Real people hosting real events — from intimate jam sessions to city-wide festivals.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { icon: '🎵', label: 'Music' },
                  { icon: '💻', label: 'Tech' },
                  { icon: '🎨', label: 'Art' },
                  { icon: '🍽️', label: 'Food' },
                ].map(c => (
                  <Link
                    key={c.label}
                    to={`/events/upcoming?category=${c.label.toLowerCase()}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-400/30 text-sm font-medium text-gray-200 transition-all"
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span>{c.label}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex -space-x-1.5">
                  {['from-pink-500 to-rose-500', 'from-purple-500 to-pink-500', 'from-amber-500 to-pink-500']
                    .map((c, i) => <span key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${c} ring-2 ring-ink-700`} />)}
                </div>
                <span>Joined by creators worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED STRIP ─── */}
      <section className="mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="eyebrow mb-1.5">
              <Calendar size={12} /> Happening soon
            </p>
            <h2 className="font-display text-2xl font-black text-white">Featured upcoming events</h2>
          </div>
          <Link to="/events/upcoming" className="text-sm text-pink-300 hover:text-pink-200 font-medium inline-flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featured.map((e, i) => (
              <div key={e.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <EventCard event={e} compact />
              </div>
            ))}
          </div>
        ) : (
          <div className="panel p-10 text-center relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 mb-4">
              <Sparkles size={26} className="text-pink-300" />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-1.5">No events yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-5">
              The calendar's empty — but it doesn't have to stay that way. Be the first to host something.
            </p>
            <Link to="/events/create" className="btn-pink inline-flex">
              <PlusCircle size={15} /> Create the first event
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ icon: Icon, label, value, accent = 'text-white' }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={15} className="text-pink-300" />
      </span>
      <div>
        <div className={`font-display text-lg font-black leading-none ${accent}`}>{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}
