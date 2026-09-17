'use client'

import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import { PageHeader, Card, CardHeader, CardTitle } from '../../../components/ui'
import { Bell, ChevronRight } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  MODERATOR: 'Moderator',
  SUPPORT: 'Support',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-canvas-300/60 dark:border-dark-line last:border-b-0">
      <span className="text-sm text-ink-400 dark:text-dark-text-soft">{label}</span>
      <span className="text-sm font-semibold text-ink-900 dark:text-dark-text">{value}</span>
    </div>
  )
}

export default function AccountPage() {
  const { admin } = useAuthStore()

  return (
    <div className="max-w-xl space-y-5">
      <PageHeader title="Account" subtitle="Your admin profile" />

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <Row label="Name" value={admin?.name ?? '—'} />
        <Row label="Role" value={admin?.role ? ROLE_LABELS[admin.role] ?? admin.role : '—'} />
        <Row label="Telegram ID" value={admin?.telegramId ?? '—'} />
      </Card>

      <Link href="/account/notifications">
        <Card hoverable className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Bell size={17} className="text-ink-400 dark:text-dark-text-soft" />
            <span className="text-sm font-semibold text-ink-900 dark:text-dark-text">Notifications</span>
          </div>
          <ChevronRight size={16} className="text-ink-300 dark:text-dark-text-soft" />
        </Card>
      </Link>
    </div>
  )
}
