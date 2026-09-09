import { Button } from './Button'

export function Pagination({
  page, total, limit, onChange,
}: { page: number; total: number; limit: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-canvas-300/60">
      <Button size="sm" variant="ghost" onClick={() => onChange(page - 1)} disabled={page === 1}>← Previous</Button>
      <span className="text-xs text-ink-400">Page {page} of {pages}</span>
      <Button size="sm" variant="ghost" onClick={() => onChange(page + 1)} disabled={page * limit >= total}>Next →</Button>
    </div>
  )
}
