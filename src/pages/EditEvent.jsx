import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit, MapPin, Calendar, Clock, FileText, Tag, Users } from 'lucide-react'
import { eventService } from '../services/eventService'
import { storageService } from '../services/storageService'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input, { Textarea, Select } from '../components/ui/Input'
import ImageUploader from '../components/events/ImageUploader'
import { EVENT_CATEGORIES } from '../utils/constants'
import { PageLoader } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [newImages, setNewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    category: 'music',
    date: '',
    time: '',
    attendees_count: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await eventService.getById(id)
        // Check permission
        if (data.created_by !== user?.id && !isAdmin) {
          toast.error('You do not have permission to edit this event')
          navigate(`/events/${id}`)
          return
        }
        setForm({
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          category: data.category || 'other',
          date: data.date || '',
          time: data.time?.slice(0, 5) || '',
          attendees_count: data.attendees_count?.toString() || '',
        })
        setExistingImages(data.images || [])
      } catch (err) {
        toast.error('Event not found')
        navigate('/events/upcoming')
      } finally {
        setPageLoading(false)
      }
    }
    if (user) fetch()
  }, [id, user, isAdmin, navigate])

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.date) e.date = 'Date is required'
    if (!form.time) e.time = 'Time is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleRemoveExisting = (index) => {
    const removed = existingImages[index]
    setRemovedImages(prev => [...prev, removed])
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)

      // Delete removed images from storage
      if (removedImages.length > 0) {
        await storageService.deleteMultiple(removedImages)
      }

      // Upload new images
      let newImageUrls = []
      if (newImages.length > 0) {
        newImageUrls = await storageService.uploadMultiple(newImages, user.id)
      }

      const eventData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim(),
        category: form.category,
        date: form.date,
        time: form.time,
        images: [...existingImages, ...newImageUrls],
        attendees_count: form.attendees_count ? parseInt(form.attendees_count) : 0,
      }

      await eventService.update(id, eventData)
      toast.success('Event updated! ✨')
      navigate(`/events/${id}`)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <PageLoader />

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <div className="relative pt-12 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-4">
            <Edit size={12} /> EDITING EVENT
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Edit{' '}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Event
            </span>
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 animate-slide-up">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Basic Information
            </h2>
            <Input
              label="Event Title *"
              placeholder="Event name"
              value={form.title}
              onChange={handleChange('title')}
              error={errors.title}
            />
            <Textarea
              label="Description"
              placeholder="Describe your event..."
              rows={4}
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} /> Event Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Location *"
                placeholder="Venue or city"
                value={form.location}
                onChange={handleChange('location')}
                error={errors.location}
                leftIcon={<MapPin size={15} />}
              />
              <Select
                label="Category *"
                value={form.category}
                onChange={handleChange('category')}
              >
                {EVENT_CATEGORIES.filter(c => c.value !== 'all').map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Date *"
                type="date"
                value={form.date}
                onChange={handleChange('date')}
                error={errors.date}
                leftIcon={<Calendar size={15} />}
              />
              <Input
                label="Time *"
                type="time"
                value={form.time}
                onChange={handleChange('time')}
                error={errors.time}
                leftIcon={<Clock size={15} />}
              />
            </div>
            <Input
              label="Expected Attendees"
              type="number"
              min="0"
              placeholder="e.g. 200"
              value={form.attendees_count}
              onChange={handleChange('attendees_count')}
              leftIcon={<Users size={15} />}
            />
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Photos</h2>
            <ImageUploader
              images={newImages}
              existingUrls={existingImages}
              onChange={setNewImages}
              onRemoveExisting={handleRemoveExisting}
            />
          </div>

          <div className="flex gap-3 justify-end animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button type="button" variant="secondary" onClick={() => navigate(`/events/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftIcon={<Edit size={15} />} size="lg">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
