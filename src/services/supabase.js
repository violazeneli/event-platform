import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check your .env file ' +
    '(VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Explicit storage key so a stale token from a previous project name
    // doesn't get picked up by mistake.
    storageKey: 'eventify-auth',
    // PKCE is the modern flow and plays nicer with deep-linked email confirms.
    flowType: 'pkce',
  },
  // We don't use realtime — keep it cheap.
  realtime: { params: { eventsPerSecond: 1 } },
  global: {
    headers: { 'x-application-name': 'eventify-web' },
  },
})

/**
 * Checks whether the configured Supabase project is reachable. We hit the
 * REST root, which always responds (even without any tables) — so a network
 * error means "URL wrong / project paused / DNS issue", and any HTTP
 * response means the URL itself is fine.
 *
 * Returns:
 *   { ok: true }
 *   { ok: false, reason: 'unreachable' | 'invalid-url' | 'paused' | 'auth' | 'unknown',
 *     message: string }
 */
export async function checkSupabaseConnection() {
  // Quick URL sanity check
  try { new URL(supabaseUrl) } catch {
    return {
      ok: false,
      reason: 'invalid-url',
      message: 'VITE_SUPABASE_URL is not a valid URL. Open .env and fix it, then restart the dev server.',
    }
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    })

    if (res.status === 0) {
      return {
        ok: false,
        reason: 'unreachable',
        message: 'Network blocked the request to Supabase.',
      }
    }

    // 200 = good. 401/403 = URL OK, key invalid. 5xx = server error.
    if (res.ok) return { ok: true }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        reason: 'auth',
        message: 'Supabase rejected the API key (HTTP ' + res.status + '). The key in your .env is wrong, or doesn\'t belong to this project.',
      }
    }

    if (res.status === 503 || res.status === 502) {
      return {
        ok: false,
        reason: 'paused',
        message: 'Your Supabase project looks paused or is starting up (HTTP ' + res.status + '). Open the Supabase dashboard and click "Restore project" — free projects pause after a week of inactivity.',
      }
    }

    const body = await res.text().catch(() => '')
    return {
      ok: false,
      reason: 'unknown',
      message: `Supabase returned HTTP ${res.status}. ${body.slice(0, 160)}`,
    }
  } catch (err) {
    // TypeError: Failed to fetch / Load failed → DNS, paused project, no internet
    return {
      ok: false,
      reason: 'unreachable',
      message:
        'Could not reach ' + supabaseUrl + '. ' +
        'Most likely causes: (1) the project is PAUSED — go to your Supabase dashboard and click Restore project, ' +
        '(2) the URL in .env is wrong, or (3) you have no internet. ' +
        'Original error: ' + (err.message || err),
    }
  }
}

export default supabase
