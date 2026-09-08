'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'

interface DisputeOrder {
  id: string
  amount: number
  buyer: { id: string; name: string }
  seller: { id: string; name: string }
  listing: { id: string; title: string }
  escrowEvents: Array<{ id: string; eventType: string; note: string | null; createdAt: string }>
  createdAt: string
}

interface DisputesRes { items: DisputeOrder[]; total: number }

export default function DisputesPage() {
  const [data, setData] = useState<DisputesRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DisputeOrder | null>(null)
  const [acting, setActing] = useState(false)

  function load() {
    setLoading(true)
    api.get<DisputesRes>('/admin/disputes').then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function act(action: 'release' | 'refund') {
    if (!selected) return
    if (!confirm(`${action === 'release' ? 'Release funds to seller' : 'Refund buyer'}?`)) return
    setActing(true)
    await api.post(`/escrow/orders/${selected.id}/${action}`, {})
    setActing(false)
    setSelected(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Disputes</h2>
        <span className="text-sm" style={{ color: '#444' }}>{data?.total ?? 0} open</span>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {data?.items.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="w-full text-left bg-white rounded-xl p-4 shadow-sm border-2 transition-all"
                style={{ borderColor: selected?.id === d.id ? '#B85C2A' : 'transparent' }}
              >
                <p className="font-medium text-sm" style={{ color: '#1a3028' }}>{d.listing.title}</p>
                <p className="text-xs mt-1" style={{ color: '#888' }}>
                  {d.buyer.name} → {d.seller.name}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#c89b3c' }}>
                  {formatETB(d.amount)}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold" style={{ color: '#1a3028' }}>{selected.listing.title}</h3>

              <div className="text-sm space-y-1" style={{ color: '#444' }}>
                <p><span style={{ color: 'rgba(31,122,90,0.6)' }}>Buyer:</span> {selected.buyer.name}</p>
                <p><span style={{ color: 'rgba(31,122,90,0.6)' }}>Seller:</span> {selected.seller.name}</p>
                <p><span style={{ color: 'rgba(31,122,90,0.6)' }}>Amount:</span> <span style={{ color: '#c89b3c' }}>{formatETB(selected.amount)}</span></p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(31,122,90,0.6)' }}>
                  Escrow History
                </p>
                <div className="space-y-1">
                  {selected.escrowEvents.map((ev) => (
                    <div key={ev.id} className="text-xs" style={{ color: '#444' }}>
                      <span className="font-medium">{ev.eventType}</span>
                      {ev.note && <span> — {ev.note}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  disabled={acting}
                  onClick={() => act('release')}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: '#1f7a5a', color: '#f3efe7' }}
                >
                  Release to Seller
                </button>
                <button
                  disabled={acting}
                  onClick={() => act('refund')}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(184,92,42,0.10)', color: '#B85C2A' }}
                >
                  Refund Buyer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
