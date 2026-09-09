import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-[2px] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-[var(--shadow-popover)] bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink-400">{label}</label>
      {children}
    </div>
  )
}
