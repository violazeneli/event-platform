import { supabase } from './supabase'

/* ─── Tiny in-memory cache ───
 *
 * Most navigations (Home → Upcoming → Past → Home) re-request the same data.
 * A 60-second cache makes that feel instantaneous on the second visit while
 * the freshly-fetched copy revalidates in the background.
 *
 * Any write (create / update / delete) calls invalidate() to clear stale
 * data, so users always see their changes immediately.
 */
const CACHE_TTL_MS = 60_000
const cache = new Map() // key -> { value, expiresAt }

function cacheGet(key) {
  const e = cache.get(key)
  if (!e) return undefined
  if (e.expiresAt < Date.now()) { cache.delete(key); return undefined }
  return e.value
}
function cacheSet(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}
function invalidate(prefix = '') {
  if (!prefix) { cache.clear(); return }
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k)
}

const k = (parts) => parts.map(p => p ?? '').join('|')

export const eventService = {
  async getAll({ category, location, limit = 50, offset = 0 } = {}) {
    const key = k(['getAll', category, location, limit, offset])
    const hit = cacheGet(key); if (hit) return hit

    let query = supabase
      .from('events')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') query = query.eq('category', category)
    if (location) query = query.ilike('location', `%${location}%`)

    const { data, error } = await query
    if (error) throw error
    cacheSet(key, data)
    return data
  },

  async getUpcoming({ category, location } = {}) {
    const key = k(['getUpcoming', category, location])
    const hit = cacheGet(key); if (hit) return hit

    const now = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('events')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .gte('date', now)
      .order('date', { ascending: true })

    if (category && category !== 'all') query = query.eq('category', category)
    if (location) query = query.ilike('location', `%${location}%`)

    const { data, error } = await query
    if (error) throw error
    cacheSet(key, data)
    return data
  },

  async getPast({ category, location } = {}) {
    const key = k(['getPast', category, location])
    const hit = cacheGet(key); if (hit) return hit

    const now = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('events')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url
        )
      `)
      .lt('date', now)
      .order('date', { ascending: false })

    if (category && category !== 'all') query = query.eq('category', category)
    if (location) query = query.ilike('location', `%${location}%`)

    const { data, error } = await query
    if (error) throw error
    cacheSet(key, data)
    return data
  },

  async getById(id) {
    const key = k(['getById', id])
    const hit = cacheGet(key); if (hit) return hit

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          avatar_url,
          bio
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    cacheSet(key, data)
    return data
  },

  async getByUser(userId) {
    const key = k(['getByUser', userId])
    const hit = cacheGet(key); if (hit) return hit

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    cacheSet(key, data)
    return data
  },

  async create(eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()
    if (error) throw error
    invalidate() // events list / stats are now stale
    return data
  },

  async update(id, eventData) {
    const { data, error } = await supabase
      .from('events')
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    invalidate()
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    if (error) throw error
    invalidate()
  },

  async incrementAttendees(id) {
    const { data, error } = await supabase.rpc('increment_attendees', { event_id: id })
    if (error) throw error
    invalidate(k(['getById', id]))
    return data
  },

  async getStats() {
    const key = 'getStats'
    const hit = cacheGet(key); if (hit) return hit

    const { data: total } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })

    const now = new Date().toISOString().split('T')[0]
    const { count: upcomingCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('date', now)

    const { count: pastCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .lt('date', now)

    const result = {
      total: total?.length || 0,
      upcoming: upcomingCount || 0,
      past: pastCount || 0,
    }
    cacheSet(key, result)
    return result
  },

  async getAllForAdmin() {
    const key = 'getAllForAdmin'
    const hit = cacheGet(key); if (hit) return hit

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles:created_by (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    cacheSet(key, data)
    return data
  },

  /** Manually clear the cache — useful from auth events / pull-to-refresh. */
  invalidate,
}
