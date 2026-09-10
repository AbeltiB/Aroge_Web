'use client'

import Link from 'next/link'
import Image from 'next/image'
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

const RAIL_KEY = 'aroge-admin-sidebar-rail'

function NavItem({
  href, label, Icon, active, rail,
}: { href: string; label: string; Icon: React.ElementType; active: boolean; rail: boolean }) {
  return (
    <Link
      href={href}
      title={rail ? label : undefined}
      className={[
        'flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors',
        rail ? 'justify-center px-2 py-2' : 'px-3 py-2',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-ink-500 hover:bg-canvas-100 hover:text-ink-900',
      ].join(' ')}
    >
      <Icon size={16} strokeWidth={active ? 2.1 : 1.8} className="flex-shrink-0" />
      {!rail && <span className="truncate">{label}</span>}
    </Link>
  )
}

function NavSection({
  label, items, pathname,
}: {
  label: string
  items: { href: string; label: string; Icon: React.ElementType }[]
  pathname: string
}) {
  return (
    <div>
      <p className="px-3 mb-1 text-[11px] font-semibold uppercase text-ink-400" style={{ letterSpacing: '0.05em' }}>
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} rail={false} />
        ))}
      </div>
    </div>
  )
}

function UserMenu({
  name, role, onSignOut,
}: { name?: string; role?: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-canvas-300 hover:bg-canvas-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold bg-brand-100 text-brand-700 flex-shrink-0">
          {name?.[0] ?? 'A'}
        </div>
        <div className="min-w-0 text-left hidden sm:block">
          <p className="text-sm font-medium text-ink-900 leading-tight truncate max-w-[9rem]">{name}</p>
          <p className="text-[11px] text-ink-400 leading-tight truncate">{role}</p>
        </div>
        <ChevronDown size={15} className={`text-ink-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg border border-canvas-300 bg-white shadow-popover z-20 py-1">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-canvas-100 transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, clearAuth, isAuthenticated } = useAuthStore()
  const [rail, setRail] = useState(false)

  useEffect(() => {
    try {
      setRail(localStorage.getItem(RAIL_KEY) === '1')
    } catch {
      // ignore — falls back to defaults
    }
  }, [])

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
    <div className="flex h-dvh overflow-hidden bg-canvas-200">
      {/* Sidebar — 3 fixed regions: header, scrollable nav body, footer */}
      <aside className={`flex flex-col h-full flex-shrink-0 bg-white border-r border-canvas-300 transition-[width] duration-200 ${rail ? 'w-[68px]' : 'w-64'}`}>
        {/* Fixed header */}
        <div className={`flex-shrink-0 py-4 border-b border-canvas-300 ${rail ? 'px-3' : 'px-4'}`}>
          <div className={`flex items-center gap-2.5 ${rail ? 'justify-center' : ''}`}>
            <Image src="/logo.png" alt="Aroge" width={32} height={32} className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" />
            {!rail && (
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink-900 tracking-tight truncate">Aroge Admin</p>
                <p className="text-xs font-normal text-ink-400 truncate">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable nav body — min-h-0 lets it shrink and scroll on its own instead of forcing the sidebar (and page) to grow */}
        <nav className={`flex-1 min-h-0 overflow-y-auto py-4 ${rail ? 'px-2 space-y-1.5' : 'px-3 space-y-3'}`}>
          {rail
            ? NAV_SECTIONS.flatMap((s) => s.items).map((item) => (
              <NavItem key={item.href} {...item} active={pathname === item.href} rail />
            ))
            : NAV_SECTIONS.map((section) => (
              <NavSection key={section.label} {...section} pathname={pathname} />
            ))}
        </nav>

        {/* Fixed footer — user card + sign out, visually separated from the scrollable nav */}
        <div className={`flex-shrink-0 border-t border-canvas-300 bg-canvas-100 p-3 ${rail ? 'flex flex-col items-center gap-2' : 'space-y-1'}`}>
          {rail ? (
            <div title={admin?.name} className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold bg-brand-100 text-brand-700 flex-shrink-0">
              {admin?.name?.[0] ?? 'A'}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-1 py-1.5">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold bg-brand-100 text-brand-700 flex-shrink-0">
                {admin?.name?.[0] ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{admin?.name}</p>
                <p className="text-[11px] text-ink-400 truncate">{admin?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { clearAuth(); router.replace('/login') }}
            title={rail ? 'Sign Out' : undefined}
            className={`flex items-center gap-2.5 text-[13px] font-medium text-ink-500 hover:bg-canvas-200 hover:text-ink-900 rounded-lg transition-colors ${rail ? 'justify-center p-2' : 'w-full px-2.5 py-1.5'}`}
          >
            <LogOut size={14} />
            {!rail && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-3 border-b border-canvas-300 bg-white/90 backdrop-blur-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={toggleRail} className="p-1.5 -ml-1.5 rounded-lg text-ink-400 hover:bg-canvas-100 hover:text-ink-700 transition-colors">
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

          <UserMenu
            name={admin?.name}
            role={admin?.role}
            onSignOut={() => { clearAuth(); router.replace('/login') }}
          />
        </div>

        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
