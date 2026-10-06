import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * App-wide error boundary.
 *
 * Catches any render-time exception below it and shows a friendly recovery
 * screen — without this, a single bad component anywhere in the tree blanks
 * the whole site with a white screen of death.
 *
 * Class component because React doesn't expose `componentDidCatch` to hooks.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep this in console so a developer can debug — in a real product this
    // would be wired up to Sentry / LogRocket / similar.
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4">
        <div className="panel p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
            <AlertTriangle size={26} className="text-red-300" />
          </div>
          <h1 className="font-display text-xl font-bold text-white mb-2">
            Something broke unexpectedly
          </h1>
          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            We hit an unexpected error rendering this page. Try refreshing — if it keeps happening,
            head back to the home page.
          </p>
          {this.state.error?.message && (
            <details className="text-left mb-5">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                Technical details
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-black/40 text-[11px] text-red-200 whitespace-pre-wrap break-words">
                {String(this.state.error.message)}
              </pre>
            </details>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={this.handleReload} className="btn-pink">
              <RefreshCw size={14} /> Refresh page
            </button>
            <button onClick={this.handleGoHome} className="btn-ghost">
              <Home size={14} /> Go home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
