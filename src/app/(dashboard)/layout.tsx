'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { TopBar } from '../../components/dashboard/TopBar'
import { NAV_SECTIONS } from '../../components/dashboard/nav-config'

const RAIL_KEY = 'aroge-admin-sidebar-rail'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, clearAuth, isAuthenticated } = useAuthStore()

  const [userCollapsed, setUserCollapsed] = useState(false)
  const [autoCollapsed, setAutoCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
  const breadcrumbs = currentSectionSize <= 1 || !currentItem
    ? ['Dashboard', currentSection]
    : ['Dashboard', currentSection, currentItem.label]

  function handleLogout() {
    clearAuth()
    router.replace('/login')
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas-200 dark:bg-dark-surface">
      {/* Desktop/tablet: static, width-animated. Hidden below 900px in favor of the drawer. */}
      <div className="hidden min-[900px]:block">
        <Sidebar collapsed={userCollapsed || autoCollapsed} onToggleCollapse={toggleCollapse} />
      </div>
      {/* Off-canvas drawer — reachable via the top bar's hamburger below
          1200px (so the 900-1199px rail tier can still open a full drawer,
          per the brief's "force open should overlay, not push" note). */}
      <Sidebar
        collapsed={false}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          currentUser={{ name: admin?.name, role: admin?.role }}
          onLogout={handleLogout}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
