/**
 * Lightweight inline-SVG bar chart. No dependencies.
 *
 * Props:
 *   data    — [{ label: string, value: number, icon?: string }]
 *   accent  — Tailwind color name (e.g. 'pink', 'purple', 'amber')
 */
export default function StatsChart({ data = [], accent = 'pink' }) {
  if (!data.length) {
    return <p className="text-gray-500 text-sm py-8 text-center">No data yet</p>
  }

  const max = Math.max(1, ...data.map(d => d.value))
  const accentMap = {
    pink:   { from: '#f472b6', to: '#ec4899' },
    purple: { from: '#a855f7', to: '#7c3aed' },
    amber:  { from: '#fbbf24', to: '#f97316' },
    emerald:{ from: '#34d399', to: '#10b981' },
  }
  const c = accentMap[accent] || accentMap.pink

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (d.value / max) * 100
        return (
          <div key={d.label} className="flex items-center gap-3">
            {d.icon && <span className="text-base w-6 text-center shrink-0">{d.icon}</span>}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-gray-200 capitalize truncate">{d.label}</span>
                <span className="text-xs text-gray-500 font-mono ml-2">{d.value}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundImage: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Tiny "sparkline" — last-N values as an area chart.
 * Used for the small trend cards.
 */
export function Sparkline({ values = [], accent = '#ec4899', width = 120, height = 32 }) {
  if (!values.length) return null
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const step = width / Math.max(1, values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / (max - min || 1)) * height
    return [x, y]
  })
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const area = `${path} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={accent} stopOpacity="0.5" />
          <stop offset="100%" stopColor={accent} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-grad-${accent})`} />
      <path d={path} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
