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
  LogOut,
} from 'lucide-react'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    ],
  },
  {
    label: 'MARKETPLACE',
    items: [
      { href: '/listings', label: 'Listings', Icon: Package },
      { href: '/bundles', label: 'Bundles', Icon: Boxes },
      { href: '/categories', label: 'Categories', Icon: Tag },
    ],
  },
  {
    label: 'TRANSACTIONS',
    items: [
      { href: '/orders', label: 'Orders', Icon: ShoppingBag },
      { href: '/disputes', label: 'Disputes', Icon: ShieldCheck },
      { href: '/reviews', label: 'Reviews', Icon: Star },
      { href: '/reports', label: 'Reports', Icon: Flag },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/payments', label: 'Payments', Icon: Wallet },
      { href: '/bank-accounts', label: 'Bank Accounts', Icon: Landmark },
      { href: '/fees', label: 'Fees & Charges', Icon: Percent },
      { href: '/delivery', label: 'Delivery', Icon: Truck },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { href: '/users', label: 'Users', Icon: Users },
      { href: '/businesses', label: 'Businesses', Icon: Building2 },
      { href: '/badges', label: 'Trusted Badges', Icon: BadgeCheck },
      { href: '/holiday-mode', label: 'Holiday Mode', Icon: PalmtreeIcon },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { href: '/notifications', label: 'Notifications', Icon: Bell },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { href: '/analytics', label: 'Reports', Icon: BarChart3 },
      { href: '/audit-log', label: 'Audit Log', Icon: History },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { href: '/admins', label: 'Admins', Icon: UserCog },
    ],
  },
]

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
      style={{
        color: active ? '#1a3028' : 'rgba(243,239,231,0.85)',
        background: active ? '#f3efe7' : 'transparent',
      }}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, clearAuth, isAuthenticated } = useAuthStore()

  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') router.replace('/login')
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f3efe7' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col flex-shrink-0" style={{ background: '#1f7a5a' }}>
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(243,239,231,0.15)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: '#c89b3c', color: '#3d2a10' }}>አ</div>
            <span className="text-base font-bold" style={{ color: '#f3efe7' }}>Aroge Admin</span>
          </div>
          <p className="text-xs mt-2 truncate" style={{ color: 'rgba(243,239,231,0.5)' }}>
            {admin?.role} · {admin?.name}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-xs font-semibold tracking-widest" style={{ color: 'rgba(243,239,231,0.35)' }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, Icon }) => (
                  <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(243,239,231,0.15)' }}>
          <button
            onClick={() => { clearAuth(); router.replace('/login') }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/10"
            style={{ color: 'rgba(243,239,231,0.6)' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 px-6 py-3 border-b flex items-center justify-between" style={{ background: '#f3efe7', borderColor: 'rgba(31,122,90,0.10)' }}>
          <p className="text-sm font-medium capitalize" style={{ color: 'rgba(31,122,90,0.5)' }}>
            {pathname.replace('/', '').replace('/', ' › ') || 'dashboard'}
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(31,122,90,0.08)', color: '#1a3028' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1f7a5a', color: '#f3efe7' }}>
              {admin?.name?.[0] ?? 'A'}
            </div>
            {admin?.name}
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
