export function FilterChips<T extends string>({
  options, value, onChange, labels,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  labels?: Partial<Record<T, string>>
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt || 'ALL'}
            onClick={() => onChange(opt)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
              active ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-ink-500 border border-canvas-400 hover:bg-canvas-100',
            ].join(' ')}
          >
            {labels?.[opt] ?? (opt || 'All')}
          </button>
        )
      })}
    </div>
  )
}
