import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg px-3 py-2 text-sm bg-white border border-canvas-400 text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand-400 ${className}`}
      {...rest}
    />
  )
}
