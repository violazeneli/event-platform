import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets the scroll position on every route change. Without this, navigating
 * from a long page like Past Events back to Home leaves the new page
 * scrolled down to wherever the previous one was.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Instant — animated scrolling on every navigation feels janky.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
