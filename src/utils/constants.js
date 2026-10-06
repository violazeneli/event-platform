export const EVENT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'music', label: '🎵 Music' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'art', label: '🎨 Art & Culture' },
  { value: 'sports', label: '⚽ Sports' },
  { value: 'food', label: '🍽️ Food & Drink' },
  { value: 'business', label: '💼 Business' },
  { value: 'wellness', label: '🧘 Wellness' },
  { value: 'education', label: '📚 Education' },
  { value: 'networking', label: '🤝 Networking' },
  { value: 'outdoor', label: '🌿 Outdoor' },
  { value: 'other', label: '✨ Other' },
]

export const CATEGORY_COLORS = {
  music:      'from-violet-500 to-purple-600',
  technology: 'from-blue-500 to-cyan-600',
  art:        'from-pink-500 to-rose-600',
  sports:     'from-green-500 to-emerald-600',
  food:       'from-orange-500 to-amber-600',
  business:   'from-slate-500 to-gray-600',
  wellness:   'from-teal-500 to-green-600',
  education:  'from-indigo-500 to-blue-600',
  networking: 'from-purple-500 to-indigo-600',
  outdoor:    'from-lime-500 to-green-600',
  other:      'from-fuchsia-500 to-pink-600',
}

export const CATEGORY_ICONS = {
  music:      '🎵',
  technology: '💻',
  art:        '🎨',
  sports:     '⚽',
  food:       '🍽️',
  business:   '💼',
  wellness:   '🧘',
  education:  '📚',
  networking: '🤝',
  outdoor:    '🌿',
  other:      '✨',
}

export const MAX_IMAGES = 4
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
