import { Link, useLocation } from 'react-router-dom'

/**
 * Two-column page shell: a compact sticky sidebar on the left + a wide
 * content area to the right. Sidebar is 200 px wide and shows side-by-side
 * from md (768 px) upwards so events sit beside filters on most monitors.
 *
 * Use either:
 *   <SidebarShell sidebar={<MyCustomSidebar />}>{content}</SidebarShell>
 * or, for a simple nav list:
 *   <SidebarShell title="…" items={[{to,label,icon},...]}>{content}</SidebarShell>
 */
export default function SidebarShell({
  // simple-list mode
  title,
  eyebrow,
  items = null,
  sidebarFooter = null,

  // free-form mode (takes precedence)
  sidebar = null,

  children,
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-5 lg:py-8">
      {/* sm breakpoint = 640px → side-by-side on almost any browser window.
          Sidebar is 180px to keep events as the focus. */}
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 sm:gap-5 lg:gap-7">
        <aside className="sm:sticky sm:top-[68px] self-start">
          {sidebar
            ? <div className="panel p-3.5">{sidebar}</div>
            : <SimpleSidebar title={title} eyebrow={eyebrow} items={items || []} footer={sidebarFooter} />
          }
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  )
}

function SimpleSidebar({ title, eyebrow, items, footer }) {
  const location = useLocation()
  return (
    <div className="panel p-4">
      {(eyebrow || title) && (
        <div className="mb-3 pb-3 border-b border-white/5">
          {eyebrow && <p className="eyebrow mb-1 text-[10px]">{eyebrow}</p>}
          {title && <h2 className="font-display text-base font-bold text-white">{title}</h2>}
        </div>
      )}
      <nav className="space-y-0.5">
        {items.map((it, i) => {
          const active = it.active ?? (it.to && location.pathname === it.to)
          const Icon = it.icon
          const cls = `side-link text-[13px] py-2 ${active ? 'side-link-active' : ''}`
          if (it.to) {
            return (
              <Link key={i} to={it.to} className={cls}>
                {Icon && <Icon size={14} />}
                <span className="flex-1">{it.label}</span>
                {it.badge != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                    {it.badge}
                  </span>
                )}
              </Link>
            )
          }
          return (
            <button key={i} type="button" onClick={it.onClick} className={cls}>
              {Icon && <Icon size={14} />}
              <span className="flex-1">{it.label}</span>
              {it.badge != null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {it.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      {footer && <div className="mt-4 pt-3 border-t border-white/5">{footer}</div>}
    </div>
  )
}
