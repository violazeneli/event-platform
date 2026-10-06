import { supabase } from './supabase'

export const authService = {
  /**
   * Sign up a new user.
   *
   * If "Confirm email" is ON in Supabase, the returned `session` will be null
   * — the user has to click the link in their inbox first. Our SignUp page
   * detects that and shows the "check your email" panel.
   */
  async signUp({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Update the password of the currently signed-in user. Used both for
   * "change password" in profile AND for the recovery flow (after the user
   * clicks the password-reset link in their email and lands on /reset-password
   * already authenticated).
   */
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return data
  },

  /**
   * Update the user's email address. Supabase sends a confirmation link
   * to BOTH the old and new email (if "Secure email change" is on, default
   * is yes). Until both are confirmed the email isn't actually changed.
   */
  async updateEmail(newEmail) {
    const { data, error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` },
    )
    if (error) throw error
    return data
  },

  /**
   * Send a password-reset email. The link in the email goes through our
   * /auth/callback handler, which detects type=recovery and forwards the
   * user to /reset-password to set a new password.
   */
  async resetPasswordForEmail(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) throw error
    return data
  },

  /**
   * Resend the sign-up confirmation email — for users who lost or never
   * received the original.
   */
  async resendConfirmation(email) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
    return data
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
