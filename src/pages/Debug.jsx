import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, Terminal, Copy } from 'lucide-react'
import { supabase } from '../services/supabase'
import BrandLogo from '../components/ui/BrandLogo'

/**
 * /debug — runs a battery of checks IN THE BROWSER (not Node) so we can see
 * exactly what fails when the visible app fails. Open the page, click "Run
 * checks", then copy the output and paste it back to Claude.
 */
export default function Debug() {
  const [steps, setSteps] = useState([])
  const [running, setRunning] = useState(false)

  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  const add = (s) => setSteps(prev => [...prev, s])

  const run = async () => {
    setSteps([])
    setRunning(true)

    add({ kind: 'info', label: 'Vite mode', detail: import.meta.env.MODE })
    add({ kind: 'info', label: 'URL from .env', detail: url })
    add({ kind: 'info', label: 'Key (first/last 6)', detail: key ? key.slice(0, 6) + '…' + key.slice(-6) : '(missing)' })
    add({ kind: 'info', label: 'Browser origin', detail: window.location.origin })
    add({ kind: 'info', label: 'User agent',     detail: navigator.userAgent })

    // 1) Plain fetch to the auth settings endpoint
    try {
      const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      add({ kind: r.ok ? 'ok' : 'warn', label: 'GET /auth/v1/settings', detail: 'HTTP ' + r.status })
    } catch (err) {
      add({ kind: 'fail', label: 'GET /auth/v1/settings', detail: 'fetch threw: ' + (err.message || err) })
    }

    // 2) Plain fetch to the REST endpoint for profiles
    try {
      const r = await fetch(`${url}/rest/v1/profiles?limit=0`, {
        headers: { apikey: key, Authorization: 'Bearer ' + key },
      })
      add({ kind: r.ok ? 'ok' : 'warn', label: 'GET /rest/v1/profiles', detail: 'HTTP ' + r.status })
    } catch (err) {
      add({ kind: 'fail', label: 'GET /rest/v1/profiles', detail: 'fetch threw: ' + (err.message || err) })
    }

    // 3) Supabase client signup attempt
    const probeEmail = `debug-probe-${Date.now()}@gmail.com`
    try {
      const { data, error } = await supabase.auth.signUp({
        email: probeEmail,
        password: 'TestPass!1234',
        options: { data: { name: 'Debug' } },
      })
      if (error) {
        add({ kind: 'fail', label: 'supabase.auth.signUp', detail: error.message + ' (status ' + (error.status ?? '?') + ')' })
      } else {
        const detail = data.session
          ? 'OK — got session immediately (email auto-confirm is ON)'
          : 'OK — no session yet (email confirmation IS required)'
        add({ kind: 'ok', label: 'supabase.auth.signUp', detail })
      }
    } catch (err) {
      add({ kind: 'fail', label: 'supabase.auth.signUp', detail: 'threw: ' + (err.message || err) })
    }

    // 4) Plain fetch POST to the auth/v1/signup endpoint (mirrors what the client does)
    try {
      const r = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: 'Bearer ' + key,
        },
        body: JSON.stringify({ email: `manual-${Date.now()}@gmail.com`, password: 'TestPass!1234', data: { name: 'Manual' } }),
      })
      const body = await r.text()
      add({
        kind: r.ok ? 'ok' : 'warn',
        label: 'POST /auth/v1/signup (raw fetch)',
        detail: 'HTTP ' + r.status + ' — ' + body.slice(0, 200),
      })
    } catch (err) {
      add({ kind: 'fail', label: 'POST /auth/v1/signup (raw fetch)', detail: 'fetch threw: ' + (err.message || err) })
    }

    setRunning(false)
  }

  const copy = () => {
    const text = steps.map(s => `${iconFor(s.kind)} ${s.label}: ${s.detail}`).join('\n')
    navigator.clipboard.writeText(text).then(
      () => alert('Copied — paste it to Claude'),
      () => prompt('Copy this:', text),
    )
  }

  return (
    <div className="min-h-screen bg-ink-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <BrandLogo size="lg" />
          <h1 className="font-display text-2xl font-black text-white mt-5 flex items-center justify-center gap-2">
            <Terminal size={20} className="text-pink-300" /> Browser diagnostic
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Runs the same network calls the app makes, from inside YOUR browser. Click run, then copy the output.
          </p>
        </div>

        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <button onClick={run} disabled={running} className="btn-pink">
              {running && <Loader2 size={14} className="animate-spin" />}
              {running ? 'Running…' : 'Run checks'}
            </button>
            {steps.length > 0 && (
              <button onClick={copy} className="btn-ghost text-xs">
                <Copy size={12} /> Copy output
              </button>
            )}
          </div>

          {steps.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">
              Click "Run checks" — five tests will run in your browser.
            </p>
          ) : (
            <ul className="space-y-1.5 font-mono text-[12px]">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`w-4 shrink-0 mt-0.5 ${
                    s.kind === 'ok'   ? 'text-emerald-300' :
                    s.kind === 'warn' ? 'text-amber-300' :
                    s.kind === 'fail' ? 'text-red-400'   : 'text-gray-500'
                  }`}>
                    {s.kind === 'ok'   ? <CheckCircle2 size={14} /> :
                     s.kind === 'warn' ? '⚠'  :
                     s.kind === 'fail' ? <XCircle size={14} /> : '·'}
                  </span>
                  <span className="text-gray-300">
                    <span className="text-white font-semibold">{s.label}:</span> {s.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Tip: also open DevTools (<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">F12</kbd>) → Console tab to see any extra errors.
        </p>
      </div>
    </div>
  )
}

function iconFor(kind) {
  return kind === 'ok' ? '✅' : kind === 'warn' ? '⚠️' : kind === 'fail' ? '❌' : '·'
}
