import { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { EVENT_CATEGORIES, CATEGORY_ICONS } from '../../utils/constants'

/**
 * Compact filter sidebar widget. A small search box on top, then a tight
 * list of category chips. Designed to fit inside a 200px sidebar without
 * dominating the page — events stay the focus.
 */
export default function EventFilters({
  onFilter,
  initialCategory = 'all',
  initialLocation = '',
}) {
  const [category, setCategory] = useState(initialCategory)
  const [location, setLocation] = useState(initialLocation)

  // Debounce location input
  useEffect(() => {
    const t = setTimeout(() => onFilter({ category, location }), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  const pickCategory = (value) => {
    setCategory(value)
    onFilter({ category: value, location })
  }

  const clearAll = () => {
    setCategory('all')
    setLocation('')
    onFilter({ category: 'all', location: '' })
  }

  const hasFilters = category !== 'all' || location !== ''

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
          Search
        </label>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-7 py-1.5 text-xs text-white placeholder-gray-500
                       focus:outline-none focus:ring-1 focus:ring-pink-500/50 focus:border-pink-400/50"
          />
          {location && (
            <button
              onClick={() => setLocation('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-white"
              aria-label="Clear search"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
          <Filter size={10} /> Category
        </label>
        <div className="space-y-0.5">
          {EVENT_CATEGORIES.map(({ value, label }) => {
            const active = category === value
            const icon = value === 'all' ? '🌐' : (CATEGORY_ICONS[value] || '✨')
            const name = value === 'all' ? 'All' : label.split(' ').slice(1).join(' ')
            return (
              <button
                key={value}
                onClick={() => pickCategory(value)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                  active
                    ? 'bg-pink-500/20 text-white border border-pink-400/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-sm leading-none">{icon}</span>
                <span className="flex-1 truncate">{name}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
        >
          <X size={11} /> Clear filters
        </button>
      )}
    </div>
  )
}
