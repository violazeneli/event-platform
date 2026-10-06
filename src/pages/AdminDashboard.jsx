import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Shield, Users, Calendar, BarChart3, Activity, Trash2, Eye,
  Search, TrendingUp, Sparkles,
} from 'lucide-react'
import SidebarShell from '../components/layout/SidebarShell'
import StatsChart from '../components/admin/StatsChart'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import { userService } from '../services/userService'
import { eventService } from '../services/eventService'
import { CATEGORY_ICONS } from '../utils/constants'
import { formatShortDate } from '../utils/dateUtils'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'overview'

  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({ users: 0, total: 0, upcoming: 0, past: 0 })
  const [loading, setLoading] = useState(true)

  const [userQuery,  setUserQuery]  = useState('')
  const [eventQuery, setEventQuery] = useState('')

  const [confirmDeleteUser,  setConfirmDeleteUser]  = useState(null)
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [usersData, eventsData, userStats, eventStats] = await Promise.all([
        userService.getAllUsers(),
        eventService.getAllForAdmin(),
        userService.getUserStats(),
        eventService.getStats(),
      ])
      setUsers(usersData)
      setEvents(eventsData)
      setStats({
        users:    userStats.total,
        total:    eventStats.total,
        upcoming: eventStats.upcoming,
        past:     eventStats.past,
      })
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const setTab = (id) => setParams(id === 'overview' ? {} : { tab: id })

  const filteredUsers = useMemo(() => users.filter(u =>
    (u.name || '').toLowerCase().includes(userQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userQuery.toLowerCase())
  ), [users, userQuery])

  const filteredEvents = useMemo(() => events.filter(e =>
    (e.title || '').toLowerCase().includes(eventQuery.toLowerCase()) ||
    (e.location || '').toLowerCase().includes(eventQuery.toLowerCase())
  ), [events, eventQuery])

  const categoryData = useMemo(() => {
    const counts = events.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc }, {})
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, value]) => ({ label: category, value, icon: CATEGORY_ICONS[category] || '✨' }))
  }, [events])

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return
    try {
      setDeleting(true)
      await userService.deleteUser(confirmDeleteUser.id)
      setUsers(prev => prev.filter(u => u.id !== confirmDeleteUser.id))
      setStats(s => ({ ...s, users: Math.max(0, s.users - 1) }))
      setConfirmDeleteUser(null)
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirmDeleteEvent) return
    try {
      setDeleting(true)
      await eventService.delete(confirmDeleteEvent.id)
      setEvents(prev => prev.filter(e => e.id !== confirmDeleteEvent.id))
      setStats(s => ({ ...s, total: Math.max(0, s.total - 1) }))
      setConfirmDeleteEvent(null)
      toast.success('Event deleted')
    } catch {
      toast.error('Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  const sections = [
    { id: 'overview', label: 'Overview',   icon: BarChart3 },
    { id: 'events',   label: 'All Events', icon: Calendar, badge: events.length || null },
    { id: 'users',    label: 'All Users',  icon: Users,    badge: users.length || null },
    { id: 'stats',    label: 'Statistics', icon: TrendingUp },
  ]

  const sidebar = (
    <>
      <div className="mb-4 pb-4 border-b border-white/5">
        <p className="eyebrow mb-1 text-amber-300/90"><Shield size={11} /> Admin</p>
        <h2 className="font-display text-lg font-bold text-white">Control Center</h2>
      </div>
      <nav className="space-y-1">
        {sections.map(s => {
          const Icon = s.icon
          const active = tab === s.id
          return (
            <button
              key={s.id}
              onClick={() => setTab(s.id)}
              className={`side-link ${active ? 'side-link-active' : ''}`}
            >
              <Icon size={15} />
              <span className="flex-1 text-left">{s.label}</span>
              {s.badge != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {s.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="mt-5 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-emerald-300 px-2">
          <Activity size={12} className="animate-pulse" />
          <span>System healthy</span>
        </div>
      </div>
    </>
  )

  return (
    <SidebarShell sidebar={sidebar}>
      {tab === 'overview' && (
        <Overview stats={stats} loading={loading} categoryData={categoryData} events={events} />
      )}

      {tab === 'events' && (
        <EventsTab
          events={filteredEvents}
          totalCount={events.length}
          query={eventQuery}
          setQuery={setEventQuery}
          loading={loading}
          onDelete={setConfirmDeleteEvent}
        />
      )}

      {tab === 'users' && (
        <UsersTab
          users={filteredUsers}
          totalCount={users.length}
          query={userQuery}
          setQuery={setUserQuery}
          loading={loading}
          onDelete={setConfirmDeleteUser}
        />
      )}

      {tab === 'stats' && (
        <StatsTab stats={stats} categoryData={categoryData} loading={loading} />
      )}

      <Modal isOpen={!!confirmDeleteUser} onClose={() => setConfirmDeleteUser(null)} title="Delete user?">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Delete <span className="text-white font-semibold">{confirmDeleteUser?.name || confirmDeleteUser?.email}</span>?
            This will also remove all of their events. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDeleteUser(null)}>Cancel</button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteUser}>Delete user</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteEvent} onClose={() => setConfirmDeleteEvent(null)} title="Delete event?">
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Delete <span className="text-white font-semibold">"{confirmDeleteEvent?.title}"</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDeleteEvent(null)}>Cancel</button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteEvent}>Delete event</Button>
          </div>
        </div>
      </Modal>
    </SidebarShell>
  )
}

/* ─── Overview ─── */
function Overview({ stats, loading, categoryData, events }) {
  const tiles = [
    { label: 'Total users',  value: stats.users,    accent: 'text-pink-300',    icon: Users },
    { label: 'Total events', value: stats.total,    accent: 'text-purple-300',  icon: Calendar },
    { label: 'Upcoming',     value: stats.upcoming, accent: 'text-emerald-300', icon: TrendingUp },
    { label: 'Past',         value: stats.past,     accent: 'text-amber-300',   icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2 text-amber-300/90"><Shield size={11} /> Admin overview</p>
        <h1 className="font-display text-3xl lg:text-4xl font-black text-white">
          Control <span className="gradient-text-rose">center</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">Manage users, events, and watch how the platform is doing.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map(t => (
          <div key={t.label} className="stat-tile">
            <t.icon size={16} className={`${t.accent} mb-3`} />
            <div className={`font-display text-3xl font-black ${t.accent}`}>
              {loading ? '—' : t.value.toLocaleString()}
            </div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-white">Events by category</h2>
            <Sparkles size={14} className="text-pink-300" />
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm py-12 text-center">Loading…</p>
          ) : (
            <StatsChart data={categoryData} accent="pink" />
          )}
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Newest events</h2>
          {loading ? (
            <p className="text-gray-500 text-sm py-12 text-center">Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-sm py-12 text-center">No events yet</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {events.slice(0, 5).map(e => (
                <li key={e.id} className="py-2.5">
                  <Link to={`/events/${e.id}`} className="flex items-center gap-3 hover:bg-white/5 rounded-lg px-2 -mx-2 py-1 transition-colors">
                    <span className="text-base shrink-0">{CATEGORY_ICONS[e.category] || '✨'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{e.title}</p>
                      <p className="text-xs text-gray-500">{formatShortDate(e.created_at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Stats tab ─── */
function StatsTab({ stats, categoryData, loading }) {
  const total = stats.total || 1
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-2 text-amber-300/90"><TrendingUp size={11} /> Statistics</p>
        <h1 className="font-display text-3xl font-black text-white">Platform statistics</h1>
        <p className="text-gray-400 text-sm mt-1.5">A snapshot of everything happening on Eventify.</p>
      </header>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat label="Users"    value={stats.users}    accent="text-pink-300" />
        <BigStat label="Events"   value={stats.total}    accent="text-purple-300" />
        <BigStat label="Upcoming" value={stats.upcoming} accent="text-emerald-300" />
        <BigStat label="Past"     value={stats.past}     accent="text-amber-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Events by category</h2>
          {loading ? (
            <p className="text-gray-500 text-sm py-8 text-center">Loading…</p>
          ) : (
            <StatsChart data={categoryData} accent="pink" />
          )}
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Upcoming vs Past</h2>
          {loading ? (
            <p className="text-gray-500 text-sm py-8 text-center">Loading…</p>
          ) : (
            <StatsChart
              accent="purple"
              data={[
                { label: 'Upcoming', value: stats.upcoming, icon: '🗓️' },
                { label: 'Past',     value: stats.past,     icon: '🕰️' },
              ]}
            />
          )}
          <div className="mt-6 pt-4 border-t border-white/5 text-xs text-gray-500 flex justify-between">
            <span>Upcoming share</span>
            <span className="text-pink-300 font-mono">
              {Math.round((stats.upcoming / total) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BigStat({ label, value, accent }) {
  return (
    <div className="stat-tile">
      <div className={`font-display text-4xl font-black ${accent}`}>{value.toLocaleString()}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  )
}

/* ─── Events tab ─── */
function EventsTab({ events, totalCount, query, setQuery, loading, onDelete }) {
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2 text-amber-300/90"><Calendar size={11} /> All events</p>
          <h1 className="font-display text-3xl font-black text-white">Events</h1>
          <p className="text-gray-400 text-sm mt-1.5">View and remove any event on the platform.</p>
        </div>
        <span className="text-xs text-gray-500">{events.length} of {totalCount}</span>
      </header>

      <SearchInput value={query} onChange={setQuery} placeholder="Search events by title or location…" />

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <Th>Event</Th>
              <Th className="hidden sm:table-cell">Date</Th>
              <Th className="hidden md:table-cell">Creator</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">Loading events…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">No events found</td></tr>
            ) : events.map(e => (
              <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">{CATEGORY_ICONS[e.category] || '✨'}</span>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate max-w-[260px]">{e.title}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[260px]">{e.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">{formatShortDate(e.date)}</td>
                <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">{e.profiles?.name || e.profiles?.email || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/events/${e.id}`} title="View" className="p-2 rounded-lg text-gray-500 hover:text-pink-300 hover:bg-pink-500/10">
                      <Eye size={14} />
                    </Link>
                    <button onClick={() => onDelete(e)} title="Delete" className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Users tab ─── */
function UsersTab({ users, totalCount, query, setQuery, loading, onDelete }) {
  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2 text-amber-300/90"><Users size={11} /> All users</p>
          <h1 className="font-display text-3xl font-black text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1.5">Manage everyone signed up to the platform.</p>
        </div>
        <span className="text-xs text-gray-500">{users.length} of {totalCount}</span>
      </header>

      <SearchInput value={query} onChange={setQuery} placeholder="Search users by name or email…" />

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <Th>User</Th>
              <Th>Role</Th>
              <Th className="hidden md:table-cell">Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-500">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      url={u.avatar_url}
                      name={u.name}
                      email={u.email}
                      size="md"
                      square
                    />
                    <div>
                      <p className="text-white font-medium">{u.name || '—'}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    u.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-white/10 text-gray-300 border-white/20'
                  }`}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{formatShortDate(u.created_at)}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => onDelete(u)} title="Delete user" className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className = '' }) {
  return <th className={`text-left px-5 py-3 text-gray-400 font-semibold text-[11px] uppercase tracking-wider ${className}`}>{children}</th>
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative max-w-md">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9"
      />
    </div>
  )
}
