import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './Card'

type Accent = 'brand' | 'value' | 'action'

const ACCENT_BAR: Record<Accent, string> = {
  brand: 'bg-brand-500',
  value: 'bg-value-500',
  action: 'bg-action-500',
}

const ACCENT_TEXT: Record<Accent, string> = {
  brand: 'text-brand-600',
  value: 'text-value-700',
  action: 'text-action-600',
}

export function StatCard({
  label, value, sub, icon: Icon, accent = 'brand', href,
}: {
  label: string; value: string | number; sub?: ReactNode
  icon: React.ElementType; accent?: Accent; href?: string
}) {
  const content = (
    <Card hoverable className="group relative overflow-hidden border-transparent hover:border-canvas-300">
      <span className={`absolute top-0 left-0 right-0 h-[3px] ${ACCENT_BAR[accent]}`} />
      <div className="p-5 pt-[18px]">
        <div className="flex items-center gap-1.5 text-ink-400">
          <Icon size={13} />
          <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
        </div>
        <p className="text-3xl font-bold mt-2 tracking-tight text-ink-900 tabular-nums">{value}</p>
        {sub && <p className="text-xs mt-1.5 text-ink-400">{sub}</p>}
        {href && (
          <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${ACCENT_TEXT[accent]} opacity-0 group-hover:opacity-100 transition-opacity`}>
            View all <ArrowRight size={12} />
          </div>
        )}
      </div>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
