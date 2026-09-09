import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './Card'

type Accent = 'brand' | 'value' | 'action'

const ACCENT_CLASSES: Record<Accent, { icon: string; iconBg: string; ring: string }> = {
  brand:  { icon: 'text-brand-600',  iconBg: 'bg-brand-100',  ring: 'hover:border-brand-300' },
  value:  { icon: 'text-value-700',  iconBg: 'bg-value-100',  ring: 'hover:border-value-300' },
  action: { icon: 'text-action-600', iconBg: 'bg-action-100', ring: 'hover:border-action-300' },
}

export function StatCard({
  label, value, sub, icon: Icon, accent = 'brand', href,
}: {
  label: string; value: string | number; sub?: ReactNode
  icon: React.ElementType; accent?: Accent; href?: string
}) {
  const a = ACCENT_CLASSES[accent]
  const content = (
    <Card padded hoverable className={`group border-transparent ${a.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="text-3xl font-bold mt-1.5 tracking-tight text-ink-900 tabular-nums">{value}</p>
          {sub && <p className="text-xs mt-1.5 text-ink-400">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBg}`}>
          <Icon size={18} className={a.icon} />
        </div>
      </div>
      {href && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${a.icon} opacity-0 group-hover:opacity-100 transition-opacity`}>
          View all <ArrowRight size={12} />
        </div>
      )}
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
