import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`text-sm rounded-lg px-3 py-2 bg-white border border-canvas-400 text-ink-900 font-medium dark:bg-dark-surface-raised dark:border-dark-line dark:text-dark-text ${className}`}
      {...rest}
    />
  )
}
