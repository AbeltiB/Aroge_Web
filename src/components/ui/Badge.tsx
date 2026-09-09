import type { ReactNode } from 'react'

export type BadgeTone = 'brand' | 'value' | 'action' | 'neutral' | 'danger'

// Solid fills for meaningful status (matches how production dashboards like
// verify.et badge "Active" etc. — strong, unambiguous at a glance) — neutral
// stays a light tag for secondary/non-status labels.
const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: 'bg-brand-500 text-white',
  value: 'bg-value-500 text-white',
  action: 'bg-action-500 text-white',
  neutral: 'bg-canvas-300 text-ink-600',
  danger: 'bg-red-500 text-white',
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  )
}

// Maps common backend status strings to a sensible tone + readable label.
// Not exhaustive — pages with their own vocabulary can pass explicit tones.
const STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: 'brand', APPROVED: 'brand', VERIFIED: 'brand', COMPLETED: 'brand',
  PAID_ESCROWED: 'brand', IN_TRANSIT: 'brand', RESOLVED: 'brand',
  PENDING: 'value', PENDING_PAYMENT: 'value', DRAFT: 'value', PENDING_VERIFICATION: 'value',
  FLAGGED: 'action', DISPUTED: 'action', SUSPENDED: 'action', BANNED: 'action', REJECTED: 'action',
  ARCHIVED: 'neutral', REFUNDED: 'neutral', REMOVED: 'neutral', CANCELLED: 'neutral',
}

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral'
  return <Badge tone={tone}>{status.replace(/_/g, ' ')}</Badge>
}
