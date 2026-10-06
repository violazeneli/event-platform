const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-12 h-12 border-[3px]',
  xl: 'w-16 h-16 border-4',
}

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        border-purple-500/30
        border-t-purple-500
        animate-spin
        ${className}
      `}
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-pink-500/20 border-b-pink-500 animate-spin animate-reverse" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/5 rounded-full w-1/3" />
        <div className="h-6 bg-white/5 rounded-full w-2/3" />
        <div className="h-4 bg-white/5 rounded-full w-full" />
        <div className="h-4 bg-white/5 rounded-full w-4/5" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-white/5 rounded-full w-1/4" />
          <div className="h-8 bg-white/5 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  )
}
