import { RefreshCw } from 'lucide-react'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-2.5 text-ink-400">
        <RefreshCw size={15} className="animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
}
