'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { PageHeader, Card, CardHeader, CardTitle, Button, Toggle, EmptyState, LoadingState, Pagination } from '../../../../components/ui'
import { AlertTriangle, Flag, Wallet, Truck, Building2, Bell } from 'lucide-react'

interface AdminNotification {
  id: string
  type: string
  title: string
  body: string
  relatedType: string | null
  relatedId: string | null
  readAt: string | null
  createdAt: string
}

interface NotificationsRes { items: AdminNotification[]; total: number; page: number; limit: number }

const TYPE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  DISPUTE_OPENED: { label: 'Disputes', Icon: AlertTriangle },
  REPORT_FILED: { label: 'Reports', Icon: Flag },
  PAYMENT_PROOF_UPLOADED: { label: 'Payment proofs', Icon: Wallet },
  DELIVERY_REQUESTED: { label: 'Delivery requests', Icon: Truck },
  BUSINESS_REGISTERED: { label: 'Business registrations', Icon: Building2 },
}
const ALL_TYPES = Object.keys(TYPE_META)
const LIMIT = 20

export default function AccountNotificationsPage() {
  const [data, setData] = useState<NotificationsRes | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [mutedTypes, setMutedTypes] = useState<string[]>([])
  const [prefsLoading, setPrefsLoading] = useState(true)

  function load(p = page) {
    setLoading(true)
    api.get<NotificationsRes>(`/admin/notifications?page=${p}&limit=${LIMIT}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  function loadPrefs() {
    setPrefsLoading(true)
    api.get<{ mutedTypes: string[] }>('/admin/notification-prefs').then((res) => {
      if (res.success) setMutedTypes(res.data.mutedTypes)
      setPrefsLoading(false)
    })
  }

  useEffect(() => { load(); loadPrefs() }, [])

  async function markRead(id: string) {
    setData((d) => d ? { ...d, items: d.items.map((n) => n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n) } : d)
    await api.patch(`/admin/notifications/${id}/read`, {})
  }

  async function markAllRead() {
    setData((d) => d ? { ...d, items: d.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) } : d)
    await api.patch('/admin/notifications/read-all', {})
  }

  async function toggleMute(type: string) {
    const next = mutedTypes.includes(type) ? mutedTypes.filter((t) => t !== type) : [...mutedTypes, type]
    setMutedTypes(next)
    await api.patch('/admin/notification-prefs', { mutedTypes: next })
  }

  const hasUnread = data?.items.some((n) => !n.readAt)

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Notifications" subtitle="Platform events that need admin attention" />

      <Card>
        <CardHeader>
          <CardTitle>Mute categories</CardTitle>
        </CardHeader>
        <div className="p-5 space-y-3">
          {prefsLoading ? <LoadingState label="Loading preferences…" /> : ALL_TYPES.map((type) => {
            const meta = TYPE_META[type]
            const muted = mutedTypes.includes(type)
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <meta.Icon size={15} className="text-ink-400 dark:text-dark-text-soft" />
                  <span className="text-sm font-medium text-ink-700 dark:text-dark-text">{meta.label}</span>
                </div>
                <Toggle checked={!muted} onChange={() => toggleMute(type)} />
              </div>
            )
          })}
          <p className="text-xs text-ink-400 dark:text-dark-text-soft pt-1">
            Muted categories still appear below — they just won&apos;t count toward your unread bell.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent ({data?.total ?? 0})</CardTitle>
          {hasUnread && <Button size="sm" variant="ghost" onClick={markAllRead}>Mark all read</Button>}
        </CardHeader>

        {loading ? <LoadingState /> : !data?.items.length ? (
          <EmptyState icon={Bell} title="No notifications yet" subtitle="Dispute, report, and review events will show up here." />
        ) : (
          <div className="divide-y divide-canvas-300/60 dark:divide-dark-line">
            {data.items.map((n) => {
              const meta = TYPE_META[n.type]
              const Icon = meta?.Icon ?? Bell
              const isUnread = !n.readAt
              return (
                <button
                  key={n.id}
                  onClick={() => isUnread && markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-canvas-100 dark:hover:bg-white/5 ${isUnread ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-canvas-100 dark:bg-white/5">
                    <Icon size={14} className="text-ink-500 dark:text-dark-text-soft" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${isUnread ? 'font-bold text-ink-900 dark:text-dark-text' : 'font-medium text-ink-700 dark:text-dark-text-soft'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-ink-400 dark:text-dark-text-soft mt-0.5">{n.body}</p>
                    <p className="text-[11px] text-ink-300 dark:text-dark-text-soft mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {isUnread && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-action-500" />}
                </button>
              )
            })}
          </div>
        )}

        {data && data.total > LIMIT && (
          <div className="px-5 py-3.5 border-t border-canvas-300/60 dark:border-dark-line">
            <Pagination page={page} total={data.total} limit={LIMIT} onChange={(p) => { setPage(p); load(p) }} />
          </div>
        )}
      </Card>
    </div>
  )
}
