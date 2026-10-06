import Navbar from './Navbar'
import Footer from './Footer'

/**
 * Standard page layout: sticky navbar + content + footer.
 * (The ConnectionGuard is mounted globally in App.jsx so it shows on every
 * route, including the auth pages.)
 */
export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  )
}
