import { useState } from 'react'

/**
 * Reusable avatar.
 *
 * If `url` is set and the image loads we show it; otherwise we fall back to a
 * pink-purple gradient circle with the user's initials.
 *
 * Sizes are pixel-based so it stays consistent everywhere.
 */
const sizeMap = {
  xs: { px: 24, text: 'text-[10px]', radius: 'rounded-full' },
  sm: { px: 28, text: 'text-xs',     radius: 'rounded-xl' },
  md: { px: 36, text: 'text-sm',     radius: 'rounded-xl' },
  lg: { px: 56, text: 'text-lg',     radius: 'rounded-2xl' },
  xl: { px: 88, text: 'text-3xl',    radius: 'rounded-3xl' },
}

export default function Avatar({
  url,
  name,
  email,
  size = 'md',
  ring = true,
  square = false,
  className = '',
}) {
  const [imgErr, setImgErr] = useState(false)
  const cfg = sizeMap[size] || sizeMap.md

  // Build initials: prefer name → first + last initial, fallback to email's first letter
  const initials = (() => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/)
      if (parts.length === 1) return parts[0][0].toUpperCase()
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    if (email) return email[0].toUpperCase()
    return '?'
  })()

  const radius = square ? cfg.radius : 'rounded-full'
  const ringClass = ring ? 'ring-2 ring-white/10' : ''
  const showImage = url && !imgErr

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden font-bold text-white shrink-0 ${radius} ${ringClass} ${className} ${
        showImage ? 'bg-ink-700' : 'bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-500'
      }`}
      style={{ width: cfg.px, height: cfg.px }}
      aria-label={name || email || 'User'}
    >
      {showImage ? (
        <img
          src={url}
          alt={name || email || ''}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
          // Avatars are tiny + nearly always above-the-fold, so eager loading
          // is cheaper than the lazy-loading delay.
          loading="eager"
          decoding="async"
        />
      ) : (
        <span className={cfg.text}>{initials}</span>
      )}
    </span>
  )
}
