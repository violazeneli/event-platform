import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Compass } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative text-center animate-scale-in max-w-xl">
        <div className="font-display text-[160px] sm:text-[200px] font-black leading-none bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent mb-2 animate-gradient bg-[length:200%_auto]">
          404
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold mb-5">
          <Compass size={12} /> Lost in space
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          The page you're looking for doesn't exist, may have moved, or never made it past the launchpad.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button leftIcon={<Home size={16} />} size="lg">Back to home</Button>
          </Link>
          <Button variant="secondary" size="lg" leftIcon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
