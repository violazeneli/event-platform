import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { eventService } from '../services/eventService'
import EventGrid from '../components/events/EventGrid'
import EventFilters from '../components/events/EventFilters'
import SidebarShell from '../components/layout/SidebarShell'
import toast from 'react-hot-toast'

export default function UpcomingEvents() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    location: searchParams.get('location') || '',
  })

  useEffect(() => { fetchEvents(filters) /* eslint-disable-next-line */ }, [])

  const fetchEvents = async (f) => {
    try {
      setLoading(true)
      const data = await eventService.getUpcoming(f)
      setEvents(data)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = (f) => {
    setFilters(f)
    fetchEvents(f)
  }

  const sidebar = (
    <>
      <div className="mb-3 pb-3 border-b border-white/5">
        <p className="eyebrow text-[10px] mb-0.5"><Calendar size={10} /> Filters</p>
        <h2 className="font-display text-sm font-bold text-white">Refine</h2>
      </div>
      <EventFilters
        onFilter={handleFilter}
        initialCategory={filters.category}
        initialLocation={filters.location}
      />
      <p className="mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500">
        {loading ? 'Loading…' : `${events.length} match${events.length === 1 ? '' : 'es'}`}
      </p>
    </>
  )

  return (
    <SidebarShell sidebar={sidebar}>
      <header className="mb-5">
        <p className="eyebrow mb-1.5"><Calendar size={11} /> Upcoming</p>
        <h1 className="font-display text-2xl lg:text-3xl font-black text-white">
          What's <span className="gradient-text">happening soon</span>
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          {loading ? 'Loading events…' : `${events.length} event${events.length !== 1 ? 's' : ''} coming up.`}
        </p>
      </header>

      <EventGrid
        events={events}
        loading={loading}
        emptyTitle="No upcoming events yet"
        emptyMessage="Be the first to put something on the calendar — your event will show up here."
        emptyIcon={Calendar}
        showCreateCta
      />
    </SidebarShell>
  )
}
