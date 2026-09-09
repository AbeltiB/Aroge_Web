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
  LogOut, ChevronDown,
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

const STORAGE_KEY = 'aroge-admin-collapsed-sections'

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        'relative flex items-center gap-2.5 pl-7 pr-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-white/12 text-white font-semibold'
          : 'text-brand-100/70 font-medium hover:bg-white/8 hover:text-white',
      ].join(' ')}
    >
      {active && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-value-400" />}
      <Icon size={15} strokeWidth={active ? 2.4 : 2} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
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
  const hasActive = items.some((i) => pathname === i.href)

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-200/50 hover:text-brand-100/80 transition-colors"
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      <div
        className="overflow-hidden transition-[grid-template-rows] duration-200 grid"
        style={{ gridTemplateRows: collapsed ? '0fr' : '1fr' }}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pt-0.5 pb-1 relative">
            {items.length > 1 && (
              <span className="absolute left-[18px] top-1 bottom-4 w-px bg-white/10" />
            )}
            {items.map((item) => (
              <NavItem key={item.href} {...item} active={pathname === item.href} />
            ))}
          </div>
        </div>
      </div>
      {hasActive && collapsed ? null : null}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, clearAuth, isAuthenticated } = useAuthStore()
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCollapsedSections(JSON.parse(raw))
    } catch {
      // ignore — falls back to all-expanded
    }
  }, [])

  function toggleSection(label: string) {
    setCollapsedSections((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') router.replace('/login')
    return null
  }

  const currentLabel = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.href === pathname)?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-canvas-200">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col flex-shrink-0 bg-brand-800">
        <div className="px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black bg-value-400 text-value-900 shadow-sm">አ</div>
            <span className="text-base font-bold text-white tracking-tight">Aroge Admin</span>
          </div>
          <div className="mt-3 flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/8">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-value-400 text-value-900 flex-shrink-0">
              {admin?.name?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
              <p className="text-[10px] text-brand-200/60 uppercase tracking-wide">{admin?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          {NAV_SECTIONS.map((section) => (
            <NavSection
              key={section.label}
              {...section}
              pathname={pathname}
              collapsed={!!collapsedSections[section.label]}
              onToggle={() => toggleSection(section.label)}
            />
          ))}
        </nav>

        <div className="p-2.5 border-t border-white/10">
          <button
            onClick={() => { clearAuth(); router.replace('/login') }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-brand-100/70 hover:bg-white/8 hover:text-white transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-3.5 border-b border-canvas-300/70 bg-canvas-100/90 backdrop-blur-sm flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-700">{currentLabel}</p>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
