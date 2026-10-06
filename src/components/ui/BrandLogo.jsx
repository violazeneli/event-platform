/**
 * Compact brand mark — a pink-purple "E" tile.
 * Used in the navbar, footer and auth pages.
 */
const sizeMap = {
  sm: { mark: 26, gap: 'gap-2',   text: 'text-base' },
  md: { mark: 32, gap: 'gap-2.5', text: 'text-lg' },
  lg: { mark: 44, gap: 'gap-3',   text: 'text-2xl' },
}

export default function BrandLogo({ size = 'md', showWordmark = true, className = '' }) {
  const { mark, gap, text } = sizeMap[size] || sizeMap.md

  return (
    <span className={`inline-flex items-center ${gap} group ${className}`}>
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stopColor="#f472b6" />
            <stop offset="55%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#brand-grad)" />
        {/* Stylised "E" — clean, no calendar tabs */}
        <path d="M11 11 H29 V16 H17 V18 H27 V22 H17 V24 H29 V29 H11 Z" fill="white" />
      </svg>

      {showWordmark && (
        <span className={`${text} font-display font-black tracking-tight text-white`}>
          Eventify
        </span>
      )}
    </span>
  )
}
