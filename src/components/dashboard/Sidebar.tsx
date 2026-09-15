'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { NAV_SECTIONS } from './nav-config'

type Props = {
  collapsed: boolean
  onToggleCollapse: () => void
  /** mobile off-canvas open state — undefined means "not rendering the mobile drawer variant" */
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

function NavItemRow({
  href, label, Icon, count, active, collapsed,
}: { href: string; label: string; Icon: React.ElementType; count?: number; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={[
        'mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors',
        collapsed ? 'justify-center' : '',
        active ? 'bg-white/12 text-white' : 'text-white/80 hover:bg-white/6',
      ].join(' ')}
    >
      <Icon size={17} strokeWidth={active ? 2.1 : 1.8} className={`flex-shrink-0 ${active ? 'text-value-400' : ''}`} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && !!count && (
        <span className="ml-auto flex-shrink-0 rounded-full bg-action-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

/**
 * Sidebar chrome is brand, not theme — this forest-dark background stays
 * the same in light and dark mode (see globals.css comment on the dark-*
 * tokens). Only the content surface and top bar invert.
 */
export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: Props) {
  const pathname = usePathname()
  const [foldedSections, setFoldedSections] = useState<Set<string>>(new Set())

  function toggleSection(label: string) {
    setFoldedSections((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const content = (
    <div
      className={`flex h-full flex-col bg-brand-800 text-white transition-[width] duration-200 ${
        collapsed ? 'w-[74px]' : 'w-64'
      }`}
    >
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-white/10 px-4 py-4">
        <div className="h-7.5 w-7.5 flex-none rounded-lg bg-value-500" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white font-display">Aroge</div>
            <div className="truncate text-[10.5px] text-white/55">Admin console</div>
          </div>
        )}
        <button
          onClick={onCloseMobile ?? onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto flex h-6.5 w-6.5 flex-none items-center justify-center rounded-md bg-white/8 text-white/70 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeft size={14} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3.5">
        {NAV_SECTIONS.map((section) => {
          const isFolded = foldedSections.has(section.label)
          return (
            <div key={section.label} className="mb-1.5">
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10.5px] font-bold tracking-wide text-white/45 hover:text-white/70 focus-visible:outline-2 focus-visible:outline-white/60 rounded"
                >
                  {section.label.toUpperCase()}
                  <ChevronDown size={12} className={isFolded ? '-rotate-90' : ''} />
                </button>
              )}
              {!isFolded &&
                section.items.map((item) => (
                  <NavItemRow key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
                ))}
            </div>
          )
        })}
      </nav>
    </div>
  )

  // Desktop: static, width-animated (collapsed prop driven by persisted
  // choice + the 900-1199px auto-collapse tier in DashboardLayout).
  if (mobileOpen === undefined) return content

  // Mobile (<900px): off-canvas drawer over a dimmed scrim.
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/45" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  )
}
