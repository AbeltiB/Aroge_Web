import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { Card } from './Card'

export function Table({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    </Card>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-canvas-100 text-ink-400 text-xs font-semibold uppercase tracking-wide">{children}</thead>
}

export function Th({ children, className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`text-left px-4 py-3 whitespace-nowrap ${className}`} {...rest}>{children}</th>
}

export function Tr({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={`border-t border-canvas-300/60 ${onClick ? 'cursor-pointer hover:bg-canvas-100/70 transition-colors' : ''} ${className}`}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-ink-700 ${className}`} {...rest}>{children}</td>
}
