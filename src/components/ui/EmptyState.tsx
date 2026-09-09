import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon, title, subtitle,
}: { icon: React.ElementType; title: string; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-2xl bg-canvas-200 flex items-center justify-center mb-3">
        <Icon size={22} className="text-ink-300" />
      </div>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {subtitle && <p className="text-xs text-ink-400 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  )
}
