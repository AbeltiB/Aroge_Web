'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import { Card, CardTitle, Button, StatusBadge, LoadingState } from '../../../../components/ui'
import { ArrowLeft } from 'lucide-react'

interface OrderDetail {
  id: string
  amount: number
  deliveryFee: number
  serviceFee: number
  paymentMethod: string
  deliveryMethod: string
  orderStatus: string
  paymentStatus: string
  feeSnapshot: { feeId: string; name: string; type: string; value: number; amount: number }[] | null
  createdAt: string
  buyer: { id: string; name: string; avatarUrl: string | null; city: string | null }
  seller: { id: string; name: string; avatarUrl: string | null; city: string | null }
  listing: { id: string; title: string } | null
  bundle: { id: string; items: { listing: { id: string; title: string } }[] } | null
  payment: {
    id: string
    gateway: string
    gatewayRef: string | null
    status: string
    proofUploadedAt: string | null
    amount: number
  } | null
  delivery: {
    status: string
    pickupAddress: string
    dropoffAddress: string
    fee: number
    rejectedReason?: string | null
  } | null
  escrowEvents: { id: string; eventType: string; note: string | null; amount: number; createdAt: string }[]
}

interface OrderMessage {
  id: string
  body: string
  mediaKey: string | null
  createdAt: string
  senderId: string
  sender: { id: string; name: string }
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [messages, setMessages] = useState<OrderMessage[] | null>(null)

  function load() {
    setLoading(true)
    api.get<OrderDetail>(`/admin/orders/${params.id}`).then((res) => {
      if (res.success) setOrder(res.data)
      setLoading(false)
    })
    api.get<OrderMessage[]>(`/admin/orders/${params.id}/messages`).then((res) => {
      if (res.success) setMessages(res.data)
    })
  }

  useEffect(() => { load() }, [params.id])

  async function actEscrow(action: 'release' | 'refund') {
    if (!order) return
    if (!confirm(`${action === 'release' ? 'Release funds to seller' : 'Refund buyer'}?`)) return
    setActing(true)
    const res = await api.post(`/escrow/orders/${order.id}/${action}`, {})
    setActing(false)
    if (!res.success) { alert((res as any).message ?? 'Action failed'); return }
    load()
  }

  async function viewProof() {
    if (!order?.payment) return
    const res = await api.get<{ url: string }>(`/admin/payments/${order.payment.id}/proof-url`)
    if (res.success) window.open(res.data.url, '_blank', 'noopener,noreferrer')
    else alert((res as any).message ?? 'No proof on file')
  }

  async function verifyTransfer() {
    if (!order?.payment) return
    setActing(true)
    const res = await api.post(`/admin/payments/${order.payment.id}/verify`, {})
    setActing(false)
    if (!res.success) { alert((res as any).message ?? 'Could not verify'); return }
    load()
  }

  async function rejectTransfer() {
    if (!order?.payment) return
    if (!confirm('Reject this transfer proof?')) return
    setActing(true)
    const res = await api.post(`/admin/payments/${order.payment.id}/reject`, {})
    setActing(false)
    if (!res.success) { alert((res as any).message ?? 'Could not reject'); return }
    load()
  }

  if (loading) return <LoadingState />
  if (!order) return <p className="text-sm text-ink-400">Order not found.</p>

  const itemLabel = order.bundle ? `Bundle (${order.bundle.items.length} items)` : order.listing?.title ?? '—'
  const total = order.amount + order.deliveryFee + order.serviceFee

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft size={15} /> Back
        </button>
        <h2 className="text-xl font-bold text-ink-900">Order Detail</h2>
      </div>

      <Card padded className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{itemLabel}</CardTitle>
          <StatusBadge status={order.orderStatus} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-ink-400">Buyer</p>
            <p className="text-ink-900">{order.buyer.name} {order.buyer.city ? `· ${order.buyer.city}` : ''}</p>
          </div>
          <div>
            <p className="text-ink-400">Seller</p>
            <p className="text-ink-900">{order.seller.name} {order.seller.city ? `· ${order.seller.city}` : ''}</p>
          </div>
          <div>
            <p className="text-ink-400">Payment Method</p>
            <p className="text-ink-900">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-ink-400">Delivery Method</p>
            <p className="text-ink-900">{order.deliveryMethod}</p>
          </div>
        </div>

        <div className="border-t border-canvas-300/60 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-ink-700"><span>Item price</span><span>{formatETB(order.amount)}</span></div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-ink-700"><span>Delivery fee</span><span>{formatETB(order.deliveryFee)}</span></div>
          )}
          {order.feeSnapshot?.map((f) => (
            <div key={f.feeId} className="flex justify-between text-ink-700"><span>{f.name}</span><span>{formatETB(f.amount)}</span></div>
          ))}
          <div className="flex justify-between font-semibold pt-1"><span className="text-ink-900">Total</span><span className="text-value-700">{formatETB(total)}</span></div>
        </div>
      </Card>

      {order.payment && (
        <Card padded className="space-y-3">
          <CardTitle className="text-base">Payment</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-ink-400">Gateway</p>
              <p className="text-ink-900">{order.payment.gateway}</p>
            </div>
            <div>
              <p className="text-ink-400">Status</p>
              <p className="text-ink-900">{order.payment.status}</p>
            </div>
            {order.payment.gatewayRef && (
              <div className="sm:col-span-2">
                <p className="text-ink-400">Gateway Ref</p>
                <p className="font-mono text-xs text-ink-500">{order.payment.gatewayRef}</p>
              </div>
            )}
          </div>

          {order.payment.gateway === 'BANK_TRANSFER' && order.payment.status === 'PENDING' && order.payment.proofUploadedAt && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={viewProof}>View Proof</Button>
              <Button size="sm" variant="primary" disabled={acting} onClick={verifyTransfer}>Verify</Button>
              <Button size="sm" variant="danger" disabled={acting} onClick={rejectTransfer}>Reject</Button>
            </div>
          )}
          {order.payment.gateway === 'BANK_TRANSFER' && order.payment.status === 'PENDING' && !order.payment.proofUploadedAt && (
            <p className="text-xs text-ink-400">Buyer has not uploaded a transfer proof yet.</p>
          )}
        </Card>
      )}

      {order.delivery && (
        <Card padded className="space-y-1.5">
          <CardTitle className="text-base mb-1">Delivery</CardTitle>
          <p className="text-sm text-ink-700">Status: {order.delivery.status}</p>
          <p className="text-sm text-ink-700">Pickup: {order.delivery.pickupAddress}</p>
          <p className="text-sm text-ink-700">Drop-off: {order.delivery.dropoffAddress}</p>
          {order.delivery.rejectedReason && (
            <p className="text-xs text-action-600">Rejected: {order.delivery.rejectedReason}</p>
          )}
        </Card>
      )}

      <Card padded className="space-y-2">
        <CardTitle className="text-base mb-1">Escrow History</CardTitle>
        {order.escrowEvents.length === 0 ? (
          <p className="text-sm text-ink-400">No events yet.</p>
        ) : order.escrowEvents.map((ev) => (
          <div key={ev.id} className="text-xs border-t border-canvas-300/60 pt-2 text-ink-700">
            <span className="font-semibold text-brand-600">{ev.eventType}</span>
            {ev.note && <span> — {ev.note}</span>}
            <span className="ml-2 text-ink-400">{new Date(ev.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </Card>

      <Card padded className="space-y-2">
        <CardTitle className="text-base mb-1">Conversation</CardTitle>
        {messages === null ? (
          <p className="text-sm text-ink-400">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-400">No messages between buyer and seller for this order.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((m) => {
              const isBuyer = m.senderId === order.buyer.id
              return (
                <div key={m.id} className={`text-sm rounded-lg p-2.5 ${isBuyer ? 'bg-value-50' : 'bg-brand-50'}`}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`font-semibold text-xs ${isBuyer ? 'text-value-800' : 'text-brand-700'}`}>
                      {m.sender.name} {isBuyer ? '(buyer)' : '(seller)'}
                    </span>
                    <span className="text-xs text-ink-400">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-ink-900">{m.mediaKey ? '📷 Photo' : m.body}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {order.orderStatus === 'DISPUTED' && (
        <div className="flex gap-3">
          <Button variant="primary" disabled={acting} onClick={() => actEscrow('release')} className="flex-1">Release to Seller</Button>
          <Button variant="danger" disabled={acting} onClick={() => actEscrow('refund')} className="flex-1">Refund Buyer</Button>
        </div>
      )}
    </div>
  )
}
