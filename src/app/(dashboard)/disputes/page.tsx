'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import { PageHeader, Card, Button, LoadingState, EmptyState } from '../../../components/ui'
import { ShieldCheck } from 'lucide-react'

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

interface DisputeMessage {
  id: string
  body: string
  mediaKey: string | null
  createdAt: string
  senderId: string
  sender: { id: string; name: string }
}

export default function DisputesPage() {
  const [data, setData] = useState<DisputesRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DisputeOrder | null>(null)
  const [acting, setActing] = useState(false)
  const [messages, setMessages] = useState<DisputeMessage[] | null>(null)

  function load() {
    setLoading(true)
    api.get<DisputesRes>('/admin/disputes').then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selected) { setMessages(null); return }
    setMessages(null)
    api.get<DisputeMessage[]>(`/admin/orders/${selected.id}/messages`).then((res) => {
      if (res.success) setMessages(res.data)
    })
  }, [selected])

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
    <div className="space-y-5">
      <PageHeader title="Disputes" subtitle={`${data?.total ?? 0} open`} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={ShieldCheck} title="No open disputes" subtitle="The marketplace is healthy right now." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            {data.items.map((d) => {
              const active = selected?.id === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`w-full text-left rounded-2xl p-4 border-2 transition-all shadow-[var(--shadow-card)] ${
                    active ? 'bg-action-50 border-action-400' : 'bg-white border-transparent hover:border-canvas-400'
                  }`}
                >
                  <p className="font-semibold text-sm text-ink-900">{d.listing.title}</p>
                  <p className="text-xs mt-1 text-ink-400">{d.buyer.name} → {d.seller.name}</p>
                  <p className="text-xs mt-1 font-bold text-value-700">{formatETB(d.amount)}</p>
                </button>
              )
            })}
          </div>

          {selected && (
            <Card padded className="space-y-4">
              <h3 className="font-bold text-ink-900">{selected.listing.title}</h3>

              <div className="text-sm space-y-1 text-ink-700">
                <p><span className="text-ink-400">Buyer:</span> {selected.buyer.name}</p>
                <p><span className="text-ink-400">Seller:</span> {selected.seller.name}</p>
                <p><span className="text-ink-400">Amount:</span> <span className="font-semibold text-value-700">{formatETB(selected.amount)}</span></p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-ink-400">Escrow History</p>
                <div className="space-y-1">
                  {selected.escrowEvents.map((ev) => (
                    <div key={ev.id} className="text-xs text-ink-700">
                      <span className="font-semibold">{ev.eventType}</span>
                      {ev.note && <span> — {ev.note}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-ink-400">Conversation</p>
                {messages === null ? (
                  <p className="text-xs text-ink-400">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-ink-400">No messages between buyer and seller.</p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {messages.map((m) => {
                      const isBuyer = m.senderId === selected.buyer.id
                      return (
                        <div key={m.id} className={`text-xs rounded-lg p-2.5 ${isBuyer ? 'bg-value-50' : 'bg-brand-50'}`}>
                          <span className={`font-semibold ${isBuyer ? 'text-value-800' : 'text-brand-700'}`}>{m.sender.name}:</span>{' '}
                          <span className="text-ink-900">{m.mediaKey ? '📷 Photo' : m.body}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="primary" disabled={acting} onClick={() => act('release')} className="flex-1">
                  Release to Seller
                </Button>
                <Button variant="danger" disabled={acting} onClick={() => act('refund')} className="flex-1">
                  Refund Buyer
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
