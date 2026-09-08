'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import type { Order } from '@arogenpm/sdk'

interface OrdersRes { items: Order[]; total: number }

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT: { bg: '#faeeda', color: '#3d2a10' },
  PAID_ESCROWED: { bg: '#e6f0eb', color: '#1f7a5a' },
  IN_TRANSIT: { bg: '#e6f0eb', color: '#174d39' },
  COMPLETED: { bg: '#e6f0eb', color: '#174d39' },
  DISPUTED: { bg: 'rgba(184,92,42,0.12)', color: '#B85C2A' },
  REFUNDED: { bg: '#f5f5f5', color: '#888' },
}

export default function OrdersPage() {
  const [data, setData] = useState<OrdersRes | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  function load(s = status) {
    setLoading(true)
    api.get<OrdersRes>(`/admin/orders${s ? `?status=${s}` : ''}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Orders</h2>
        <span className="text-sm" style={{ color: '#444' }}>{data?.total ?? 0} total</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING_PAYMENT', 'PAID_ESCROWED', 'IN_TRANSIT', 'COMPLETED', 'DISPUTED', 'REFUNDED'].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => { setStatus(s); load(s) }}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={status === s
              ? { background: '#1f7a5a', color: '#f3efe7' }
              : { background: '#f3efe7', color: '#1f7a5a' }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((o) => {
                const sc = STATUS_COLORS[o.orderStatus] ?? { bg: '#f5f5f5', color: '#888' }
                return (
                  <tr
                    key={o.id}
                    className="border-t cursor-pointer hover:bg-black/[0.02]"
                    style={{ borderColor: 'rgba(31,122,90,0.08)' }}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/orders/${o.id}`} className="font-mono text-xs hover:underline" style={{ color: '#888' }}>
                        {o.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#c89b3c' }}>
                      {formatETB(o.amount)}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#444' }}>{o.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={sc}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#888' }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
