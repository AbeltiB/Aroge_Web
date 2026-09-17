import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Package, Tag, Boxes,
  ShoppingBag, ShieldCheck,
  Users, Building2,
  BarChart3,
  Percent, Truck, Wallet, Landmark,
  Bell, BadgeCheck, Flag,
  PalmtreeIcon,
  History, Star, UserCog,
} from 'lucide-react'

/** Keys match the /admin/nav-counts response shape. */
export type NavCountKey = 'disputes' | 'pendingOrders' | 'pendingBusinesses'

export type NavItem = {
  href: string
  label: string
  Icon: LucideIcon
  /** Looked up against the real /admin/nav-counts response — omitted means no badge. */
  countKey?: NavCountKey
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
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
      { href: '/orders', label: 'Orders', Icon: ShoppingBag, countKey: 'pendingOrders' },
      { href: '/disputes', label: 'Disputes', Icon: ShieldCheck, countKey: 'disputes' },
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
      { href: '/businesses', label: 'Businesses', Icon: Building2, countKey: 'pendingBusinesses' },
      { href: '/badges', label: 'Trusted Badges', Icon: BadgeCheck },
      { href: '/holiday-mode', label: 'Holiday Mode', Icon: PalmtreeIcon },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/notifications', label: 'Broadcasts', Icon: Bell },
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
