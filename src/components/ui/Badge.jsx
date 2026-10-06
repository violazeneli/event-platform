import { CATEGORY_ICONS } from '../../utils/constants'

const variants = {
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  gray: 'bg-white/10 text-gray-300 border-white/20',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export default function Badge({ children, variant = 'purple', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export function CategoryBadge({ category }) {
  const icon = CATEGORY_ICONS[category] || '✨'
  const label = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other'

  return (
    <Badge variant="purple">
      {icon} {label}
    </Badge>
  )
}

export function StatusBadge({ isPast }) {
  return isPast ? (
    <Badge variant="gray">Past Event</Badge>
  ) : (
    <Badge variant="green">Upcoming</Badge>
  )
}
