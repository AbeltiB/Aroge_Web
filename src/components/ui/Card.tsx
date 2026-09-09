import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  hoverable?: boolean
}

export function Card({ children, padded = false, hoverable = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-canvas-300/60 shadow-[var(--shadow-card)]',
        hoverable ? 'transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]' : '',
        padded ? 'p-5' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b border-canvas-300/60 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-bold text-sm text-ink-900 ${className}`}>{children}</h3>
}
