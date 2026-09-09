'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth.store'
import {
  LayoutDashboard, Package, Tag, Boxes,
  ShoppingBag, ShieldCheck,
  Users, Building2,
  BarChart3,
  Percent, Truck, Wallet, Landmark,
  Bell, BadgeCheck, Flag,
  PalmtreeIcon,
  History, Star, UserCog,
  LogOut, ChevronDown, PanelLeft, ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { href: '/listings', label: 'Listings', Icon: Package },
      { href: '/bundles', label: 'Bundles', Icon: Boxes },
      { href: '/categories', label: 'Categories', Icon: Tag },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { href: '/orders', label: 'Orders', Icon: ShoppingBag },
      { href: '/disputes', label: 'Disputes', Icon: ShieldCheck },
      { href: '/reviews', label: 'Reviews', Icon: Star },
      { href: '/reports', label: 'Reports', Icon: Flag },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/payments', label: 'Payments', Icon: Wallet },
      { href: '/bank-accounts', label: 'Bank Accounts', Icon: Landmark },
      { href: '/fees', label: 'Fees & Charges', Icon: Percent },
      { href: '/delivery', label: 'Delivery', Icon: Truck },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/users', label: 'Users', Icon: Users },
      { href: '/businesses', label: 'Businesses', Icon: Building2 },
      { href: '/badges', label: 'Trusted Badges', Icon: BadgeCheck },
      { href: '/holiday-mode', label: 'Holiday Mode', Icon: PalmtreeIcon },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/notifications', label: 'Notifications', Icon: Bell },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/analytics', label: 'Reports', Icon: BarChart3 },
      { href: '/audit-log', label: 'Audit Log', Icon: History },
    ],
  },
  {
    label: 'Platform',
    items: [
      { href: '/admins', label: 'Admins', Icon: UserCog },
    ],
  },
]

const FOLD_KEY = 'aroge-admin-collapsed-sections'
const RAIL_KEY = 'aroge-admin-sidebar-rail'

function NavItem({
  href, label, Icon, active, rail,
}: { href: string; label: string; Icon: React.ElementType; active: boolean; rail: boolean }) {
  return (
    <Link
      href={href}
      title={rail ? label : undefined}
      className={[
        'relative flex items-center gap-2.5 py-2 rounded-lg text-sm transition-colors',
        rail ? 'justify-center px-2' : 'pl-7 pr-3',
        active
          ? 'bg-brand-50 text-brand-700 font-semibold'
          : 'text-ink-500 font-medium hover:bg-canvas-200 hover:text-ink-900',
      ].join(' ')}
    >
      {active && !rail && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-brand-500" />}
      <Icon size={16} strokeWidth={active ? 2.4 : 2} className="flex-shrink-0" />
      {!rail && <span className="truncate">{label}</span>}
    </Link>
  )
}

function NavSection({
  label, items, pathname, collapsed, onToggle,
}: {
  label: string
  items: { href: string; label: string; Icon: React.ElementType }[]
  pathname: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300 hover:text-ink-500 transition-colors"
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      <div className="overflow-hidden transition-[grid-template-rows] duration-200 grid" style={{ gridTemplateRows: collapsed ? '0fr' : '1fr' }}>
        <div className="overflow-hidden">
          <div className="space-y-0.5 pt-0.5 pb-1 relative">
            {items.length > 1 && <span className="absolute left-[18px] top-1 bottom-4 w-px bg-canvas-300" />}
            {items.map((item) => (
              <NavItem key={item.href} {...item} active={pathname === item.href} rail={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, clearAuth, isAuthenticated } = useAuthStore()
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [rail, setRail] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOLD_KEY)
      if (raw) setCollapsedSections(JSON.parse(raw))
      setRail(localStorage.getItem(RAIL_KEY) === '1')
    } catch {
      // ignore — falls back to defaults
    }
  }, [])

  function toggleSection(label: string) {
    setCollapsedSections((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem(FOLD_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function toggleRail() {
    setRail((prev) => {
      const next = !prev
      try { localStorage.setItem(RAIL_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }

  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') router.replace('/login')
    return null
  }

  const currentItem = NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.label })))
    .find((i) => i.href === pathname)
  const currentSection = currentItem?.section ?? 'Dashboard'
  const currentSectionSize = NAV_SECTIONS.find((s) => s.label === currentSection)?.items.length ?? 1
  const breadcrumbs = currentSectionSize <= 1 || !currentItem
    ? ['Dashboard', currentSection]
    : ['Dashboard', currentSection, currentItem.label]

  return (
    <div className="flex h-screen overflow-hidden bg-canvas-200">
      {/* Sidebar */}
      <aside className={`flex flex-col flex-shrink-0 bg-white border-r border-canvas-300/70 transition-[width] duration-200 ${rail ? 'w-[68px]' : 'w-64'}`}>
        <div className={`pt-5 pb-4 border-b border-canvas-300/70 ${rail ? 'px-3' : 'px-5'}`}>
          <div className={`flex items-center gap-2.5 ${rail ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black bg-brand-500 text-white shadow-sm flex-shrink-0">አ</div>
            {!rail && <span className="text-base font-bold text-ink-900 tracking-tight">Aroge Admin</span>}
          </div>
          {!rail && (
            <div className="mt-3 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-canvas-100">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-value-400 text-white flex-shrink-0">
                {admin?.name?.[0] ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-900 truncate">{admin?.name}</p>
                <p className="text-[10px] text-ink-400 uppercase tracking-wide">{admin?.role}</p>
              </div>
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-3 space-y-1 ${rail ? 'px-2' : 'px-2.5'}`}>
          {rail
            ? NAV_SECTIONS.flatMap((s) => s.items).map((item) => (
              <NavItem key={item.href} {...item} active={pathname === item.href} rail />
            ))
            : NAV_SECTIONS.map((section) => (
              <NavSection
                key={section.label}
                {...section}
                pathname={pathname}
                collapsed={!!collapsedSections[section.label]}
                onToggle={() => toggleSection(section.label)}
              />
            ))}
        </nav>

        <div className={`p-2.5 border-t border-canvas-300/70 ${rail ? 'flex flex-col items-center gap-1' : ''}`}>
          <button
            onClick={() => { clearAuth(); router.replace('/login') }}
            title={rail ? 'Sign Out' : undefined}
            className={`flex items-center gap-2.5 text-sm font-medium text-ink-500 hover:bg-canvas-200 hover:text-ink-900 rounded-lg transition-colors ${rail ? 'justify-center p-2' : 'w-full px-3 py-2'}`}
          >
            <LogOut size={16} />
            {!rail && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-3.5 border-b border-canvas-300/70 bg-white/90 backdrop-blur-sm flex items-center gap-3">
          <button onClick={toggleRail} className="p-1.5 -ml-1.5 rounded-lg text-ink-400 hover:bg-canvas-200 hover:text-ink-700 transition-colors">
            <PanelLeft size={17} />
          </button>
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={13} className="text-ink-300" />}
                <span className={i === breadcrumbs.length - 1 ? 'font-semibold text-ink-900' : 'text-ink-400'}>{crumb}</span>
              </span>
            ))}
          </nav>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
