import { supabase } from './supabase'

const EVENTS_BUCKET  = 'event-images'
const AVATARS_BUCKET = 'avatars'

export const storageService = {
  /* ─── Event images ─── */

  async uploadImage(file, userId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(EVENTS_BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from(EVENTS_BUCKET)
      .getPublicUrl(data.path)
    return urlData.publicUrl
  },

  async uploadMultiple(files, userId) {
    return Promise.all(files.map(f => this.uploadImage(f, userId)))
  },

  async deleteImage(url) {
    const path = url.split(`/${EVENTS_BUCKET}/`)[1]
    if (!path) return
    const { error } = await supabase.storage
      .from(EVENTS_BUCKET)
      .remove([path])
    if (error) throw error
  },

  async deleteMultiple(urls) {
    return Promise.all(urls.map(u => this.deleteImage(u)))
  },

  getPublicUrl(path) {
    const { data } = supabase.storage.from(EVENTS_BUCKET).getPublicUrl(path)
    return data.publicUrl
  },

  /* ─── Avatars ─── */

  /**
   * Replace the user's avatar.
   *
   * Each user owns the folder `{user_id}/...` (the storage RLS policy enforces
   * this — see SETUP.md). To make sure stale photos don't pile up we list and
   * delete anything previously in the folder before uploading the new file.
   *
   * Returns the public URL of the uploaded avatar.
   */
  async uploadAvatar(file, userId) {
    if (!file) throw new Error('No file selected')

    // 1) Wipe any previous avatar(s)
    const { data: existing } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(userId, { limit: 100 })
    if (existing?.length) {
      await supabase.storage
        .from(AVATARS_BUCKET)
        .remove(existing.map(o => `${userId}/${o.name}`))
    }

    // 2) Upload new
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${userId}/avatar-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) throw error

    // 3) Public URL — append timestamp so the browser doesn't show the cached old one
    const { data: urlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
    return `${urlData.publicUrl}?v=${Date.now()}`
  },

  /**
   * Remove the user's avatar from storage. The caller is responsible for
   * setting profile.avatar_url to null in the database.
   */
  async deleteAvatar(userId) {
    const { data: existing } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(userId, { limit: 100 })
    if (!existing?.length) return
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove(existing.map(o => `${userId}/${o.name}`))
    if (error) throw error
  },
}
