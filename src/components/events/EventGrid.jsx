import { Link } from 'react-router-dom'
import { Calendar, PlusCircle, Sparkles } from 'lucide-react'
import EventCard from './EventCard'
import { CardSkeleton } from '../ui/LoadingSpinner'

/**
 * Responsive grid of event cards.
 *
 * Empty + loading states are handled here so callers don't have to repeat
 * the markup. `showCreateCta` adds a "Create the first event" button — use it
 * on the upcoming page where seeding events is the main next action.
 */
export default function EventGrid({
  events = [],
  loading = false,
  onDelete,
  showActions = false,
  emptyTitle = 'No events found',
  emptyMessage = 'Check back later for new events.',
  emptyIcon: EmptyIcon = Calendar,
  showCreateCta = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!events.length) {
    return (
      <div className="panel p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Soft gradient glow behind the empty state */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 mb-4">
          <EmptyIcon size={28} className="text-pink-300" />
        </div>
        <h3 className="font-display text-xl font-bold text-white mb-1.5">{emptyTitle}</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">{emptyMessage}</p>

        {showCreateCta && (
          <div className="mt-6">
            <Link to="/events/create" className="btn-pink inline-flex">
              <PlusCircle size={14} /> Create an event
            </Link>
            <p className="text-[11px] text-gray-500 mt-3 flex items-center justify-center gap-1">
              <Sparkles size={11} className="text-pink-400" /> Free to host — takes under a minute
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
      {events.map((event, index) => (
        <div
          key={event.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
        >
          <EventCard event={event} onDelete={onDelete} showActions={showActions} />
        </div>
      ))}
    </div>
  )
}
