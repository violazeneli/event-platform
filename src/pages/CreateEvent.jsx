import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sparkles, MapPin, Calendar, Clock, FileText, Tag, Users,
  PlusCircle, LogIn, UserPlus,
} from 'lucide-react'
import { eventService } from '../services/eventService'
import { storageService } from '../services/storageService'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input, { Textarea, Select } from '../components/ui/Input'
import ImageUploader from '../components/events/ImageUploader'
import { EVENT_CATEGORIES } from '../utils/constants'
import toast from 'react-hot-toast'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // ── Guests: friendly prompt instead of a hard redirect ──
  if (authLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 lg:px-8 py-16">
        <div className="panel p-10 text-center">
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-[1100px] mx-auto px-5 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <p className="eyebrow mb-2"><Sparkles size={11} /> Almost there</p>
            <h1 className="font-display text-3xl lg:text-4xl font-black text-white">
              Sign in to <span className="gradient-text">create an event</span>
            </h1>
            <p className="text-gray-400 mt-3 max-w-xl">
              Hosting is free. Create an account in under a minute and you'll be able to publish your event right away — anyone on Eventify can browse it.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-gray-300">
              {[
                'Free for everyone',
                'Add up to 4 photos',
                'Edit or delete anytime',
                'Beautiful detail page out of the box',
              ].map(b => (
                <li key={b} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/signup" className="btn-pink">
                <UserPlus size={15} /> Create an account
              </Link>
              <Link to="/signin" className="btn-ghost">
                <LogIn size={15} /> Sign in
              </Link>
            </div>
          </div>

          <aside className="panel p-6">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-display text-lg font-bold text-white mb-1">Why an account?</h3>
            <p className="text-gray-400 text-sm">
              An account is what lets us tie events back to you so you can edit and delete them, and so attendees know who's hosting.
            </p>
          </aside>
        </div>
      </div>
    )
  }

  // ── Signed-in users: real form below ──
  return <CreateEventForm user={user} navigate={navigate} />
}

function CreateEventForm({ user, navigate }) {
  const [loading, setLoading] = useState(false)
  const [newImages, setNewImages] = useState([])
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

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (form.title.length > 120) e.title = 'Title must be under 120 characters'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.date) e.date = 'Date is required'
    if (!form.time) e.time = 'Time is required'
    if (form.attendees_count && isNaN(Number(form.attendees_count))) {
      e.attendees_count = 'Must be a number'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)

      let imageUrls = []
      if (newImages.length > 0) {
        imageUrls = await storageService.uploadMultiple(newImages, user.id)
      }

      const eventData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim(),
        category: form.category,
        date: form.date,
        time: form.time,
        images: imageUrls,
        attendees_count: form.attendees_count ? parseInt(form.attendees_count) : 0,
        created_by: user.id,
      }

      const created = await eventService.create(eventData)
      toast.success('Event created!')
      navigate(`/events/${created.id}`)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 lg:px-8 py-10">
      <header className="mb-7">
        <p className="eyebrow mb-2"><PlusCircle size={11} /> New event</p>
        <h1 className="font-display text-3xl lg:text-4xl font-black text-white">
          Create your <span className="gradient-text">event</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">Fill in the details — your event goes live as soon as you publish.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Basic information" icon={FileText}>
          <Input
            label="Event title *"
            placeholder="Give your event an amazing name…"
            value={form.title}
            onChange={handleChange('title')}
            error={errors.title}
          />
          <Textarea
            label="Description"
            placeholder="What's your event about? What can people expect?"
            rows={4}
            value={form.description}
            onChange={handleChange('description')}
          />
        </Section>

        <Section title="Event details" icon={Tag}>
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
              error={errors.category}
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
            label="Expected attendees"
            type="number"
            min="0"
            placeholder="e.g. 200"
            value={form.attendees_count}
            onChange={handleChange('attendees_count')}
            error={errors.attendees_count}
            leftIcon={<Users size={15} />}
            helperText="Optional"
          />
        </Section>

        <Section title="Photos (optional)">
          <ImageUploader images={newImages} onChange={setNewImages} />
        </Section>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <Button type="submit" loading={loading} leftIcon={<Sparkles size={15} />} size="lg">
            {loading ? 'Publishing…' : 'Publish event'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="panel p-6 space-y-5">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={12} />} {title}
      </h2>
      {children}
    </div>
  )
}
