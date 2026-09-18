'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { AccountMenu } from './AccountMenu'
import { SearchBox } from './SearchBox'

type Props = {
  breadcrumbs: string[]
  onOpenMobileNav: () => void
  currentUser: { name?: string; role?: string }
  onLogout: () => void
  hasUnreadNotifications?: boolean
}

export function TopBar({ breadcrumbs, onOpenMobileNav, currentUser, onLogout, hasUnreadNotifications }: Props) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="sticky top-0 z-10 flex h-[60px] flex-shrink-0 items-center gap-3.5 border-b border-canvas-300 dark:border-dark-line bg-white/90 dark:bg-dark-surface-raised/90 px-5 backdrop-blur-sm">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-lg p-1.5 text-ink-400 hover:bg-canvas-100 hover:text-ink-700 dark:text-dark-text-soft dark:hover:bg-white/5 dark:hover:text-dark-text min-[1200px]:hidden"
      >
        <Menu size={19} />
      </button>

      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-ink-300 dark:text-dark-text-soft">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'font-semibold text-ink-900 dark:text-dark-text' : 'text-ink-400 dark:text-dark-text-soft'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <SearchBox />

      <div className="ml-auto flex items-center gap-2.5">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className={`flex h-[30px] w-[52px] items-center rounded-full border p-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-brand-500 ${
            isDark ? 'justify-end border-dark-line bg-dark-surface' : 'justify-start border-canvas-300 bg-canvas-100'
          }`}
        >
          <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-white ${isDark ? 'bg-value-500' : 'bg-brand-500'}`}>
            {isDark ? <Moon size={12} /> : <Sun size={12} />}
          </span>
        </button>

        <Link
          href="/account/notifications"
          aria-label="Notifications"
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-canvas-300 dark:border-dark-line bg-canvas-100 dark:bg-dark-surface text-ink-500 dark:text-dark-text-soft hover:bg-canvas-200 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          <Bell size={16} />
          {hasUnreadNotifications && (
            <span className="absolute right-[7px] top-[6px] h-[6px] w-[6px] rounded-full bg-action-500" />
          )}
        </Link>

        <AccountMenu name={currentUser.name} role={currentUser.role} onLogout={onLogout} />
      </div>
    </div>
  )
}
