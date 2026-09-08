'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'
import { formatETB } from '@arogenpm/sdk'

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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT: { bg: '#faeeda', color: '#3d2a10' },
  PAID_ESCROWED: { bg: '#e6f0eb', color: '#1f7a5a' },
  IN_TRANSIT: { bg: '#e6f0eb', color: '#174d39' },
  COMPLETED: { bg: '#e6f0eb', color: '#174d39' },
  DISPUTED: { bg: 'rgba(184,92,42,0.12)', color: '#B85C2A' },
  REFUNDED: { bg: '#f5f5f5', color: '#888' },
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  function load() {
    setLoading(true)
    api.get<OrderDetail>(`/admin/orders/${params.id}`).then((res) => {
      if (res.success) setOrder(res.data)
      setLoading(false)
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

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>
  if (!order) return <p className="text-sm text-gray-400">Order not found.</p>

  const itemLabel = order.bundle ? `Bundle (${order.bundle.items.length} items)` : order.listing?.title ?? '—'
  const sc = STATUS_COLORS[order.orderStatus] ?? { bg: '#f5f5f5', color: '#888' }
  const total = order.amount + order.deliveryFee + order.serviceFee

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#1f7a5a' }}>← Back</button>
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Order Detail</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: '#1a3028' }}>{itemLabel}</h3>
          <span className="px-2 py-0.5 rounded-full text-xs" style={sc}>{order.orderStatus}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p style={{ color: 'rgba(31,122,90,0.6)' }}>Buyer</p>
            <p style={{ color: '#1a3028' }}>{order.buyer.name} {order.buyer.city ? `· ${order.buyer.city}` : ''}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(31,122,90,0.6)' }}>Seller</p>
            <p style={{ color: '#1a3028' }}>{order.seller.name} {order.seller.city ? `· ${order.seller.city}` : ''}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(31,122,90,0.6)' }}>Payment Method</p>
            <p style={{ color: '#1a3028' }}>{order.paymentMethod}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(31,122,90,0.6)' }}>Delivery Method</p>
            <p style={{ color: '#1a3028' }}>{order.deliveryMethod}</p>
          </div>
        </div>

        <div className="border-t pt-3 space-y-1 text-sm" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
          <div className="flex justify-between"><span style={{ color: '#444' }}>Item price</span><span style={{ color: '#444' }}>{formatETB(order.amount)}</span></div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between"><span style={{ color: '#444' }}>Delivery fee</span><span style={{ color: '#444' }}>{formatETB(order.deliveryFee)}</span></div>
          )}
          {order.feeSnapshot?.map((f) => (
            <div key={f.feeId} className="flex justify-between"><span style={{ color: '#444' }}>{f.name}</span><span style={{ color: '#444' }}>{formatETB(f.amount)}</span></div>
          ))}
          <div className="flex justify-between font-semibold pt-1"><span style={{ color: '#1a3028' }}>Total</span><span style={{ color: '#c89b3c' }}>{formatETB(total)}</span></div>
        </div>
      </div>

      {order.payment && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-semibold" style={{ color: '#1a3028' }}>Payment</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p style={{ color: 'rgba(31,122,90,0.6)' }}>Gateway</p>
              <p style={{ color: '#1a3028' }}>{order.payment.gateway}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(31,122,90,0.6)' }}>Status</p>
              <p style={{ color: '#1a3028' }}>{order.payment.status}</p>
            </div>
            {order.payment.gatewayRef && (
              <div className="col-span-2">
                <p style={{ color: 'rgba(31,122,90,0.6)' }}>Gateway Ref</p>
                <p className="font-mono text-xs" style={{ color: '#888' }}>{order.payment.gatewayRef}</p>
              </div>
            )}
          </div>

          {order.payment.gateway === 'BANK_TRANSFER' && order.payment.status === 'PENDING' && order.payment.proofUploadedAt && (
            <div className="flex gap-2 pt-2">
              <button onClick={viewProof} className="text-xs px-3 py-1.5 rounded" style={{ background: '#f3efe7', color: '#1f7a5a' }}>
                View Proof
              </button>
              <button disabled={acting} onClick={verifyTransfer} className="text-xs px-3 py-1.5 rounded" style={{ background: '#1f7a5a', color: '#f3efe7' }}>
                Verify
              </button>
              <button disabled={acting} onClick={rejectTransfer} className="text-xs px-3 py-1.5 rounded" style={{ background: '#B85C2A', color: '#fff' }}>
                Reject
              </button>
            </div>
          )}
          {order.payment.gateway === 'BANK_TRANSFER' && order.payment.status === 'PENDING' && !order.payment.proofUploadedAt && (
            <p className="text-xs" style={{ color: '#888' }}>Buyer has not uploaded a transfer proof yet.</p>
          )}
        </div>
      )}

      {order.delivery && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
          <h3 className="font-semibold" style={{ color: '#1a3028' }}>Delivery</h3>
          <p className="text-sm" style={{ color: '#444' }}>Status: {order.delivery.status}</p>
          <p className="text-sm" style={{ color: '#444' }}>Pickup: {order.delivery.pickupAddress}</p>
          <p className="text-sm" style={{ color: '#444' }}>Drop-off: {order.delivery.dropoffAddress}</p>
          {order.delivery.rejectedReason && (
            <p className="text-xs" style={{ color: '#B85C2A' }}>Rejected: {order.delivery.rejectedReason}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-2">
        <h3 className="font-semibold" style={{ color: '#1a3028' }}>Escrow History</h3>
        {order.escrowEvents.length === 0 ? (
          <p className="text-sm" style={{ color: '#888' }}>No events yet.</p>
        ) : order.escrowEvents.map((ev) => (
          <div key={ev.id} className="text-xs border-t pt-2" style={{ borderColor: 'rgba(31,122,90,0.06)', color: '#444' }}>
            <span className="font-medium" style={{ color: '#1f7a5a' }}>{ev.eventType}</span>
            {ev.note && <span> — {ev.note}</span>}
            <span className="ml-2" style={{ color: '#888' }}>{new Date(ev.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {order.orderStatus === 'DISPUTED' && (
        <div className="flex gap-3">
          <button
            disabled={acting}
            onClick={() => actEscrow('release')}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#1f7a5a', color: '#f3efe7' }}
          >
            Release to Seller
          </button>
          <button
            disabled={acting}
            onClick={() => actEscrow('refund')}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(184,92,42,0.10)', color: '#B85C2A' }}
          >
            Refund Buyer
          </button>
        </div>
      )}
    </div>
  )
}
