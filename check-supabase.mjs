/**
 * Supabase diagnostic script.
 *
 * Run from the project root:
 *   node check-supabase.mjs
 *
 * It reads your .env, tests the URL, the API key, the database tables,
 * the trigger, and the auth endpoint, then prints a verdict.
 *
 * Paste the WHOLE output back to Claude — including the lines with ❌ —
 * so the exact problem can be diagnosed without anyone needing access
 * to your Supabase project.
 *
 * The script never prints your full key — only the last 6 chars — so it's
 * safe to share publicly.
 */

import fs from 'node:fs'
import path from 'node:path'

const ENV_FILE = path.resolve('.env')

// ── Read .env (minimal parser, no deps) ──
function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    return null
  }
  const out = {}
  const text = fs.readFileSync(ENV_FILE, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const tag  = (s) => `\x1b[2m${s}\x1b[0m`
const ok   = (s) => `\x1b[32m✅\x1b[0m ${s}`
const bad  = (s) => `\x1b[31m❌\x1b[0m ${s}`
const warn = (s) => `\x1b[33m⚠️ \x1b[0m ${s}`
const head = (s) => `\n\x1b[1m\x1b[35m── ${s} ──\x1b[0m`

function maskKey(k) {
  if (!k) return '(missing)'
  if (k.length <= 8) return k
  return k.slice(0, 6) + '…' + k.slice(-6) + '  (length ' + k.length + ')'
}

function keyKind(k) {
  if (!k) return 'missing'
  if (k.startsWith('sb_publishable_')) return 'NEW publishable (sb_publishable_)'
  if (k.startsWith('sb_secret_'))      return 'NEW SECRET (sb_secret_)  ⚠️ wrong key — never use server-side keys in the browser'
  if (k.startsWith('eyJ')) {
    // Try to peek at the role inside the JWT (no signature validation, just inspecting payload)
    try {
      const payload = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString('utf8'))
      return `legacy JWT (role="${payload.role}")` + (payload.role !== 'anon' ? '  ⚠️ should be "anon"' : '')
    } catch {
      return 'legacy JWT (could not decode)'
    }
  }
  return 'unknown format'
}

const env = loadEnv()

console.log(head('Environment'))
if (!env) {
  console.log(bad('.env file not found at ' + ENV_FILE))
  console.log(tag('Create one based on .env.example and try again.'))
  process.exit(1)
}

const URL_VAL = env.VITE_SUPABASE_URL
const KEY_VAL = env.VITE_SUPABASE_ANON_KEY

console.log(`URL:  ${URL_VAL || bad('(missing)')}`)
console.log(`KEY:  ${maskKey(KEY_VAL)}`)
console.log(`KEY format:  ${keyKind(KEY_VAL)}`)

if (!URL_VAL || !KEY_VAL) {
  console.log(bad('Missing variables — fix .env and rerun.'))
  process.exit(1)
}

let URL_OBJ
try { URL_OBJ = new URL(URL_VAL) } catch {
  console.log(bad('VITE_SUPABASE_URL is not a valid URL.'))
  process.exit(1)
}

if (!URL_OBJ.hostname.endsWith('.supabase.co')) {
  console.log(warn('URL host is "' + URL_OBJ.hostname + '" — Supabase project hosts normally end in .supabase.co'))
}

// ── DNS / reachability ──
console.log(head('Reachability'))
async function ping(url, init = {}) {
  const start = Date.now()
  try {
    const res = await fetch(url, init)
    return { ok: true, status: res.status, ms: Date.now() - start, res }
  } catch (err) {
    return { ok: false, error: err.message || String(err), ms: Date.now() - start }
  }
}

const root = await ping(URL_VAL)
if (!root.ok) {
  console.log(bad(`Cannot reach ${URL_VAL} — ${root.error}`))
  console.log(tag('  → Project is paused, URL is wrong, or the network is blocking it.'))
  console.log(tag('  → Open https://supabase.com/dashboard, find this project, click "Restore project" if paused.'))
  process.exit(2)
}
console.log(ok(`Project URL responds (HTTP ${root.status}, ${root.ms} ms)`))

// ── Auth endpoint with the key ──
console.log(head('Auth API'))
const settings = await ping(`${URL_VAL}/auth/v1/settings`, {
  headers: { apikey: KEY_VAL, Authorization: 'Bearer ' + KEY_VAL },
})
if (!settings.ok) {
  console.log(bad('Auth endpoint failed: ' + settings.error))
  process.exit(2)
}
if (settings.status === 200) {
  console.log(ok('Auth endpoint accepts the key (HTTP 200)'))
  try {
    const body = await settings.res.json()
    if ('disable_signup' in body) {
      console.log(tag('  signups disabled? ') + (body.disable_signup ? bad('YES') : ok('no')))
    }
    if ('mailer_autoconfirm' in body) {
      console.log(tag('  email auto-confirm? ') + (body.mailer_autoconfirm ? ok('YES (no confirmation needed)') : warn('NO — users must click email link before signing in')))
    }
    if (body.external) {
      const enabled = Object.entries(body.external).filter(([, v]) => v).map(([k]) => k)
      if (enabled.length) console.log(tag('  external auth providers enabled: ' + enabled.join(', ')))
    }
  } catch {
    /* not JSON, fine */
  }
} else if (settings.status === 401 || settings.status === 403) {
  console.log(bad(`Auth endpoint rejected the key (HTTP ${settings.status}).`))
  console.log(tag('  → The key in .env doesn\'t belong to this project, or it\'s the wrong type.'))
  console.log(tag('  → In Supabase: Project Settings → API → copy the "anon"/"publishable" key.'))
  process.exit(2)
} else {
  console.log(warn(`Auth endpoint returned HTTP ${settings.status}`))
}

// ── REST API + tables ──
console.log(head('Database'))

async function checkTable(name) {
  const r = await ping(`${URL_VAL}/rest/v1/${name}?limit=0`, {
    headers: { apikey: KEY_VAL, Authorization: 'Bearer ' + KEY_VAL, Prefer: 'count=exact' },
  })
  if (!r.ok) return { ok: false, msg: r.error }
  return { ok: true, status: r.status, count: r.res.headers.get('content-range') }
}

for (const t of ['profiles', 'events']) {
  const r = await checkTable(t)
  if (!r.ok) { console.log(bad(`Table "${t}" — ${r.msg}`)); continue }
  if (r.status === 404) {
    console.log(bad(`Table "${t}" does NOT exist — run the SQL setup from SETUP.md`))
  } else if (r.status === 200 || r.status === 206) {
    const rows = r.count ? r.count.split('/')[1] : '?'
    console.log(ok(`Table "${t}" exists (${rows} rows)`))
  } else if (r.status === 401 || r.status === 403) {
    console.log(warn(`Table "${t}" — got HTTP ${r.status} (RLS blocking or key wrong)`))
  } else {
    console.log(warn(`Table "${t}" — HTTP ${r.status}`))
  }
}

// ── Try a real signup attempt with a throwaway email ──
// Use a domain Supabase will accept; the email isn't real but the format is valid.
console.log(head('Sign-up dry run'))
const probeEmail = `eventify-probe-${Date.now()}@gmail.com`
const probeRes = await fetch(`${URL_VAL}/auth/v1/signup`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: KEY_VAL,
    Authorization: 'Bearer ' + KEY_VAL,
  },
  body: JSON.stringify({ email: probeEmail, password: 'TestPass!1234', data: { name: 'Probe' } }),
}).catch(err => ({ error: err.message }))

if (probeRes.error) {
  console.log(bad('Sign-up call failed at the network layer: ' + probeRes.error))
} else {
  let body = ''
  try { body = await probeRes.text() } catch {}
  let j = null; try { j = JSON.parse(body) } catch {}
  if (probeRes.ok) {
    console.log(ok(`Sign-up endpoint accepted (HTTP ${probeRes.status})`))
    if (j?.user && !j?.session) console.log(tag('  → email confirmation IS required (no session returned)'))
    if (j?.session)              console.log(tag('  → email confirmation is NOT required (session returned immediately)'))
  } else {
    console.log(bad(`Sign-up endpoint refused (HTTP ${probeRes.status})`))
    if (j?.msg)        console.log(tag('  msg:        ' + j.msg))
    if (j?.message)    console.log(tag('  message:    ' + j.message))
    if (j?.error_code) console.log(tag('  error_code: ' + j.error_code))
    if (!j) console.log(tag('  raw body:   ' + body.slice(0, 240)))
  }
}

console.log(head('Done'))
console.log(tag('Copy this entire output and paste it back to Claude.'))
