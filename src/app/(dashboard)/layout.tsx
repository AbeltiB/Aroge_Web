'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { api } from '../../lib/api'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { TopBar } from '../../components/dashboard/TopBar'
import { NAV_SECTIONS, type NavCountKey } from '../../components/dashboard/nav-config'

const RAIL_KEY = 'aroge-admin-sidebar-rail'
const COUNTS_POLL_MS = 60_000

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, clearAuth, isAuthenticated } = useAuthStore()

  const [userCollapsed, setUserCollapsed] = useState(false)
  const [autoCollapsed, setAutoCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [counts, setCounts] = useState<Partial<Record<NavCountKey, number>>>({})
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadCounts() {
      const [navRes, unreadRes] = await Promise.all([
        api.get<Record<NavCountKey, number>>('/admin/nav-counts'),
        api.get<{ count: number }>('/admin/notifications/unread-count'),
      ])
      if (cancelled) return
      if (navRes.success) setCounts(navRes.data)
      if (unreadRes.success) setUnreadNotifications(unreadRes.data.count)
    }
    loadCounts()
    const id = setInterval(loadCounts, COUNTS_POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => {
    try {
      setUserCollapsed(localStorage.getItem(RAIL_KEY) === '1')
    } catch {
      // ignore — falls back to defaults
    }
  }, [])

  // 900-1199px: force the rail regardless of the persisted preference,
  // without overwriting it — growing back past 1200px restores whatever
  // the user actually chose.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (max-width: 1199px)')
    const update = () => setAutoCollapsed(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  function toggleCollapse() {
    setUserCollapsed((prev) => {
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

  // Account routes aren't in the sidebar nav, so they don't resolve via
  // currentItem above — give them their own explicit breadcrumb instead of
  // falling through to a confusing "Dashboard / Dashboard".
  const ACCOUNT_BREADCRUMBS: Record<string, string[]> = {
    '/account': ['Account', 'Profile'],
    '/account/notifications': ['Account', 'Notifications'],
  }

  const breadcrumbs = ACCOUNT_BREADCRUMBS[pathname]
    ?? (currentSectionSize <= 1 || !currentItem
      ? ['Dashboard', currentSection]
      : ['Dashboard', currentSection, currentItem.label])

  function handleLogout() {
    clearAuth()
    router.replace('/login')
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas-200 dark:bg-dark-surface">
      {/* The sidebar has ~25 links ahead of the top bar's search/theme/bell/
          account controls and the page content — without this, a keyboard
          user has to Tab through the entire nav tree just to reach either. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-2 focus:outline-white"
      >
        Skip to main content
      </a>
      {/* Desktop/tablet: static, width-animated. Hidden below 900px in favor of the drawer. */}
      <div className="hidden min-[900px]:block">
        <Sidebar collapsed={userCollapsed || autoCollapsed} onToggleCollapse={toggleCollapse} counts={counts} />
      </div>
      {/* Off-canvas drawer — reachable via the top bar's hamburger below
          1200px (so the 900-1199px rail tier can still open a full drawer,
          per the brief's "force open should overlay, not push" note). */}
      <Sidebar
        collapsed={false}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        counts={counts}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          currentUser={{ name: admin?.name, role: admin?.role }}
          onLogout={handleLogout}
          hasUnreadNotifications={unreadNotifications > 0}
        />
        {/* min-w-0 keeps this flex child from growing to fit wide content
            (e.g. a table) — without it the whole page gains horizontal
            overflow instead of the table's own overflow-x-auto scrolling. */}
        <main id="main-content" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-y-auto outline-none">
          <div className="mx-auto max-w-[1400px] p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
