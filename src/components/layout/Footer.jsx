import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import BrandLogo from '../ui/BrandLogo'

export default function Footer() {
  const links = [
    { to: '/',                label: 'Home' },
    { to: '/events/upcoming', label: 'Upcoming' },
    { to: '/events/past',     label: 'Past Events' },
    { to: '/events/create',   label: 'Create Event' },
    { to: '/signin',          label: 'Sign In' },
    { to: '/signup',          label: 'Sign Up' },
  ]

  return (
    <footer className="border-t border-white/10 bg-ink-900/80">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <BrandLogo size="sm" />
          <nav className="hidden md:flex items-center gap-4 text-xs">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="text-gray-500 hover:text-pink-300 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-gray-500 text-xs flex items-center gap-1.5">
          © {new Date().getFullYear()} Eventify · Built with
          <Heart size={11} className="text-pink-500 fill-pink-500" />
          by Viola Zeneli
        </p>
      </div>
    </footer>
  )
}
