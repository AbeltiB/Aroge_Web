'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatETB } from '@arogenpm/sdk'
import { Search, User, Package, Building2, Receipt, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'

interface SearchResults {
  users: { id: string; name: string; telegramId: string; city: string | null }[]
  listings: { id: string; title: string; price: number; status: string }[]
  businesses: { id: string; name: string; type: string; verifiedAt: string | null }[]
  orders: { id: string; amount: number; orderStatus: string; buyer: { name: string }; seller: { name: string } }[]
}

const EMPTY: SearchResults = { users: [], listings: [], businesses: [], orders: [] }
const DEBOUNCE_MS = 300

export function SearchBox() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) {
      setResults(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      api.get<SearchResults>(`/admin/search?q=${encodeURIComponent(query)}`).then((res) => {
        if (res.success) setResults(res.data)
        setLoading(false)
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function go(path: string) {
    router.push(path)
    setOpen(false)
    setQ('')
  }

  const hasQuery = q.trim().length >= 2
  const hasResults = results.users.length || results.listings.length || results.businesses.length || results.orders.length

  return (
    <div ref={containerRef} className="relative ml-3 hidden w-[280px] sm:block">
      <div className="flex items-center gap-2 rounded-lg border border-canvas-300 dark:border-dark-line bg-canvas-100 dark:bg-dark-surface px-3 py-2 text-[12.5px] text-ink-700 dark:text-dark-text focus-within:border-brand-400">
        {loading ? <Loader2 size={14} className="flex-shrink-0 animate-spin text-ink-300 dark:text-dark-text-soft" /> : <Search size={14} className="flex-shrink-0 text-ink-300 dark:text-dark-text-soft" />}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="Search orders, users…"
          className="w-full bg-transparent text-[12.5px] placeholder:text-ink-400 dark:placeholder:text-dark-text-soft focus:outline-none"
        />
      </div>

      {open && hasQuery && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-[420px] overflow-y-auto rounded-lg border border-canvas-300 dark:border-dark-line bg-white dark:bg-dark-surface-raised shadow-lg">
          {!loading && !hasResults && (
            <p className="px-4 py-6 text-center text-[12.5px] text-ink-400 dark:text-dark-text-soft">No results for &ldquo;{q}&rdquo;</p>
          )}

          {results.users.length > 0 && (
            <ResultGroup label="Users" icon={User}>
              {results.users.map((u) => (
                <ResultRow key={u.id} onClick={() => go(`/users?q=${encodeURIComponent(u.telegramId)}`)}>
                  <span className="font-medium text-ink-900 dark:text-dark-text">{u.name}</span>
                  <span className="text-ink-400 dark:text-dark-text-soft">{u.city ?? u.telegramId}</span>
                </ResultRow>
              ))}
            </ResultGroup>
          )}

          {results.listings.length > 0 && (
            <ResultGroup label="Listings" icon={Package}>
              {results.listings.map((l) => (
                <ResultRow key={l.id} onClick={() => go(`/listings?q=${encodeURIComponent(l.title)}`)}>
                  <span className="truncate font-medium text-ink-900 dark:text-dark-text">{l.title}</span>
                  <span className="text-value-700 dark:text-dark-text-soft">{formatETB(l.price)}</span>
                </ResultRow>
              ))}
            </ResultGroup>
          )}

          {results.businesses.length > 0 && (
            <ResultGroup label="Businesses" icon={Building2}>
              {results.businesses.map((b) => (
                <ResultRow key={b.id} onClick={() => go(`/businesses?q=${encodeURIComponent(b.name)}`)}>
                  <span className="font-medium text-ink-900 dark:text-dark-text">{b.name}</span>
                  <span className="text-ink-400 dark:text-dark-text-soft">{b.verifiedAt ? 'Verified' : 'Pending'}</span>
                </ResultRow>
              ))}
            </ResultGroup>
          )}

          {results.orders.length > 0 && (
            <ResultGroup label="Orders" icon={Receipt}>
              {results.orders.map((o) => (
                <ResultRow key={o.id} onClick={() => go(`/orders/${o.id}`)}>
                  <span className="font-medium text-ink-900 dark:text-dark-text">{o.buyer.name} → {o.seller.name}</span>
                  <span className="text-value-700 dark:text-dark-text-soft">{formatETB(o.amount)}</span>
                </ResultRow>
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="border-b border-canvas-200 dark:border-dark-line py-1.5 last:border-b-0">
      <div className="flex items-center gap-1.5 px-4 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-300 dark:text-dark-text-soft">
        <Icon size={11} /> {label}
      </div>
      {children}
    </div>
  )
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-[12.5px] hover:bg-canvas-100 dark:hover:bg-white/5"
    >
      {children}
    </button>
  )
}
