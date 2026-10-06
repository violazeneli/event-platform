import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users, Edit, Trash2, ArrowLeft, Share2, User, ExternalLink } from 'lucide-react'
import { eventService } from '../services/eventService'
import { storageService } from '../services/storageService'
import { useAuth } from '../context/AuthContext'
import { formatEventDate, formatEventTime, isEventPast, formatRelativeTime } from '../utils/dateUtils'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/constants'
import { CategoryBadge, StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import { PageLoader } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await eventService.getById(id)
        setEvent(data)
      } catch (err) {
        toast.error('Event not found')
        navigate('/events/upcoming')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, navigate])

  const canEdit = user && event && (user.id === event.created_by || isAdmin)
  const isPast = event ? isEventPast(event.date, event.time) : false
  const gradientClass = event ? (CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other) : ''
  const categoryIcon = event ? (CATEGORY_ICONS[event.category] || '✨') : ''

  const handleDelete = async () => {
    try {
      setDeleting(true)
      // Delete images from storage
      if (event.images?.length) {
        await storageService.deleteMultiple(event.images)
      }
      await eventService.delete(id)
      toast.success('Event deleted')
      navigate('/events/upcoming')
    } catch (err) {
      toast.error('Failed to delete event')
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  if (loading) return <PageLoader />

  if (!event) return null

  const images = event.images || []
  const primaryImage = images[selectedImage] || null

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Hero image / gradient */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] opacity-20">{categoryIcon}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-4 sm:left-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm font-medium"
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>

        {/* Actions top-right */}
        <div className="absolute top-6 right-4 sm:right-6 flex gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm"
          >
            <Share2 size={14} /> Share
          </button>
          {canEdit && (
            <>
              <Link
                to={`/events/${id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition-all text-sm"
              >
                <Edit size={14} /> Edit
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 backdrop-blur-sm text-red-400 hover:bg-red-500/40 transition-all text-sm"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Image thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                  i === selectedImage ? 'border-white scale-110' : 'border-white/30 opacity-60'
                }`}
              >
                <img src={images[i]} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & badges */}
            <div className="animate-slide-up">
              <div className="flex flex-wrap gap-2 mb-3">
                <CategoryBadge category={event.category} />
                <StatusBadge isPast={isPast} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {event.title}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Created {formatRelativeTime(event.created_at)}
              </p>
            </div>

            {/* Description */}
            {event.description && (
              <div className="glass-card rounded-2xl p-6 border border-white/10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">About This Event</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Image gallery if multiple */}
            {images.length > 1 && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedImage(i)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className={`aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        i === selectedImage ? 'border-purple-500' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer */}
            {event.profiles && (
              <div className="glass-card rounded-2xl p-6 border border-white/10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Organizer</h2>
                <div className="flex items-center gap-4">
                  <Avatar
                    url={event.profiles?.avatar_url}
                    name={event.profiles?.name}
                    size="lg"
                    square
                  />
                  <div>
                    <p className="text-white font-semibold">{event.profiles.name || 'Anonymous'}</p>
                    {event.profiles.bio && (
                      <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">{event.profiles.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 sticky top-24">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Calendar size={16} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">Date</p>
                  <p className="text-white font-semibold text-sm">{formatEventDate(event.date)}</p>
                </div>
              </div>

              {event.time && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-pink-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">Time</p>
                    <p className="text-white font-semibold text-sm">{formatEventTime(event.time)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-white font-semibold text-sm">{event.location}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 mt-1 transition-colors"
                  >
                    <ExternalLink size={10} /> View on Maps
                  </a>
                </div>
              </div>

              {event.attendees_count > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">Attendees</p>
                    <p className="text-white font-semibold text-sm">{event.attendees_count.toLocaleString()} people</p>
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-4 space-y-2">
                {!isPast ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    leftIcon={<Calendar size={15} />}
                    onClick={() => toast.success('You\'re attending!')}
                  >
                    Attend Event
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    Event Has Passed
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  leftIcon={<Share2 size={15} />}
                  onClick={handleShare}
                >
                  Share Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete <span className="text-white font-semibold">"{event.title}"</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
