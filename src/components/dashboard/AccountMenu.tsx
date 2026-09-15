'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut, ChevronDown } from 'lucide-react'

type Props = {
  name?: string
  role?: string
  onLogout: () => void
}

export function AccountMenu({ name, role, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-canvas-300 dark:border-dark-line py-1 pl-1 pr-2.5 hover:bg-canvas-100 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-800 dark:text-brand-200">
          {name?.[0] ?? 'A'}
        </div>
        <span className="hidden text-[12.5px] font-bold text-ink-900 dark:text-dark-text sm:block">{name}</span>
        <ChevronDown size={14} className={`text-ink-400 dark:text-dark-text-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[230px] overflow-hidden rounded-xl border border-canvas-300 dark:border-dark-line bg-white dark:bg-dark-surface-raised shadow-[var(--shadow-popover)]">
          <div className="flex items-center gap-2.5 border-b border-canvas-300 dark:border-dark-line px-4 py-3.5">
            <div className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-md bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-800 dark:text-brand-200">
              {name?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold text-ink-900 dark:text-dark-text">{name}</div>
              <div className="truncate text-[11px] text-ink-400 dark:text-dark-text-soft">{role}</div>
            </div>
          </div>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-b border-canvas-300 dark:border-dark-line px-4 py-2.5 text-[13px] font-semibold text-ink-700 dark:text-dark-text hover:bg-canvas-100 dark:hover:bg-white/5"
          >
            Account
          </Link>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center gap-2.5 border-b border-canvas-300 dark:border-dark-line px-4 py-2.5 text-left text-[13px] font-semibold text-ink-700 dark:text-dark-text hover:bg-canvas-100 dark:hover:bg-white/5"
          >
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
            Appearance
            <span className="ml-auto text-[11px] font-medium text-ink-400 dark:text-dark-text-soft">{isDark ? 'Dark' : 'Light'}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
