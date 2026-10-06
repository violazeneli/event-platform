import { supabase } from './supabase'

export const userService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Delete a profile row. Because the schema sets the FK from
   * events.created_by → profiles.id with ON DELETE CASCADE, removing the
   * profile also removes all of that user's events.
   *
   * NOTE: this does NOT delete the auth.users row (only Supabase service
   * role can do that). The profile is gone and the user can't sign back in
   * usefully because the trigger only creates the profile on first sign-up.
   * For full hard-delete, call this through a Postgres function with
   * SECURITY DEFINER (see SETUP.md).
   */
  async deleteUser(userId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
  },

  async setAdminRole(userId, isAdmin) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: isAdmin ? 'admin' : 'user' })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserStats() {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return { total: count || 0 }
  },

  /**
   * Self-service account deletion. The currently signed-in user removes
   * their own profile (cascades to their events), then signs out.
   */
  async deleteOwnAccount(userId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (error) throw error
    await supabase.auth.signOut()
  },

  /**
   * Save an avatar URL onto the profile (used after uploading to storage).
   * Pass `null` to clear the avatar.
   */
  async setAvatarUrl(userId, url) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
