import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users, Edit, Trash2 } from 'lucide-react'
import { formatShortDate, formatEventTime, isEventPast } from '../../utils/dateUtils'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { CategoryBadge, StatusBadge } from '../ui/Badge'
import Avatar from '../ui/Avatar'

export default function EventCard({ event, onDelete, showActions = false, compact = false }) {
  const { user, isAdmin } = useAuth()
  const isPast = isEventPast(event.date, event.time)
  const canEdit = user && (user.id === event.created_by || isAdmin)
  const gradientClass = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other
  const categoryIcon = CATEGORY_ICONS[event.category] || '✨'

  const primaryImage = event.images?.[0]

  return (
    <div className={`
      group relative panel overflow-hidden transition-all duration-300
      hover:border-pink-400/40 hover:shadow-card-hover hover:-translate-y-0.5
      ${isPast ? 'opacity-80 hover:opacity-100' : ''}
    `}>
      {/* Image / gradient header */}
      <div className="relative h-44 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`relative w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center overflow-hidden`}>
            <span className="text-7xl opacity-40 group-hover:scale-110 transition-transform duration-500">{categoryIcon}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <CategoryBadge category={event.category} />
          <StatusBadge isPast={isPast} />
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white">
          <span className="px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-sm flex items-center gap-1.5">
            <Calendar size={11} />
            {formatShortDate(event.date)}
            {event.time && (
              <>
                <span className="text-white/40">·</span>
                <Clock size={11} />
                {formatEventTime(event.time)}
              </>
            )}
          </span>
        </div>

        {showActions && canEdit && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/events/${event.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-black/55 hover:bg-black/80 text-white/80 hover:text-white transition-all"
              title="Edit"
            >
              <Edit size={13} />
            </Link>
            {onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); onDelete(event) }}
                className="p-1.5 rounded-lg bg-black/55 hover:bg-black/80 text-red-300 hover:text-red-200 transition-all"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <Link to={`/events/${event.id}`} className="block p-4">
        <h3 className="font-display text-white font-bold text-base leading-snug mb-1.5 group-hover:text-pink-100 transition-colors line-clamp-2">
          {event.title}
        </h3>

        {!compact && event.description && (
          <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
          <MapPin size={12} className="text-pink-400 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Avatar
              url={event.profiles?.avatar_url}
              name={event.profiles?.name}
              size="xs"
            />
            <span className="text-gray-400 text-xs truncate max-w-28">
              {event.profiles?.name || 'Anonymous'}
            </span>
          </div>
          {event.attendees_count > 0 && (
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Users size={11} />
              <span className="font-semibold">{event.attendees_count.toLocaleString()}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
