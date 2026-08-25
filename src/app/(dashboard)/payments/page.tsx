'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from 'aroge-sdk'

interface PaymentRow {
  id: string
  gateway: string
  gatewayRef: string | null
  idempotencyKey: string
  amount: number
  status: string
  proofUploadedAt: string | null
  createdAt: string
  order: {
    id: string
    orderStatus: string
    listingId: string | null
    bundleId: string | null
    buyer: { id: string; name: string } | null
    seller: { id: string; name: string } | null
    listing: { id: string; title: string } | null
    bundle: { id: string } | null
  } | null
}

interface StatusTotal { status: string; _sum: { amount: number | null }; _count: number }

interface PaymentsRes {
  items: PaymentRow[]
  total: number
  page: number
  limit: number
  totals: StatusTotal[]
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#faeeda', color: '#3d2a10' },
  HELD: { bg: '#e6f0eb', color: '#1f7a5a' },
  RELEASED: { bg: '#e6f0eb', color: '#174d39' },
  REFUNDED: { bg: '#f5f5f5', color: '#888' },
  FAILED: { bg: 'rgba(184,92,42,0.12)', color: '#B85C2A' },
}

const STATUSES = ['', 'PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED']

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentsRes | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingTransfers, setPendingTransfers] = useState<PaymentRow[]>([])
  const [actioningId, setActioningId] = useState<string | null>(null)

  function load(s = status) {
    setLoading(true)
    api.get<PaymentsRes>(`/admin/payments${s ? `?status=${s}` : ''}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  function loadPendingTransfers() {
    api.get<PaymentsRes>('/admin/payments?gateway=BANK_TRANSFER&status=PENDING').then((res) => {
      if (res.success) setPendingTransfers(res.data.items.filter((p) => p.proofUploadedAt))
    })
  }

  useEffect(() => { load(); loadPendingTransfers() }, [])

  async function viewProof(paymentId: string) {
    const res = await api.get<{ url: string }>(`/admin/payments/${paymentId}/proof-url`)
    if (res.success) window.open(res.data.url, '_blank', 'noopener,noreferrer')
    else alert((res as any).message ?? 'No proof on file')
  }

  async function verifyTransfer(paymentId: string) {
    setActioningId(paymentId)
    const res = await api.post(`/admin/payments/${paymentId}/verify`, {})
    setActioningId(null)
    if (!res.success) { alert((res as any).message ?? 'Could not verify'); return }
    loadPendingTransfers()
    load()
  }

  async function rejectTransfer(paymentId: string) {
    if (!confirm('Reject this transfer proof? The buyer will be asked to re-upload.')) return
    setActioningId(paymentId)
    const res = await api.post(`/admin/payments/${paymentId}/reject`, {})
    setActioningId(null)
    if (!res.success) { alert((res as any).message ?? 'Could not reject'); return }
    loadPendingTransfers()
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Payments</h2>
        <span className="text-sm" style={{ color: '#444' }}>{data?.total ?? 0} total</span>
      </div>

      {pendingTransfers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3" style={{ borderLeft: '4px solid #c89b3c' }}>
          <h3 className="text-sm font-bold" style={{ color: '#3d2a10' }}>
            Bank Transfers Awaiting Verification ({pendingTransfers.length})
          </h3>
          <div className="space-y-2">
            {pendingTransfers.map((p) => {
              const itemLabel = p.order?.bundleId ? 'Bundle' : p.order?.listing?.title ?? '—'
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: '#faeeda' }}>
                  <div className="text-sm" style={{ color: '#3d2a10' }}>
                    <span className="font-semibold">{p.order?.buyer?.name ?? '—'}</span> · {itemLabel} · {formatETB(p.amount)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewProof(p.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: '#f3efe7', color: '#1f7a5a' }}
                    >
                      View Proof
                    </button>
                    <button
                      onClick={() => verifyTransfer(p.id)}
                      disabled={actioningId === p.id}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: '#1f7a5a', color: '#f3efe7', opacity: actioningId === p.id ? 0.6 : 1 }}
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => rejectTransfer(p.id)}
                      disabled={actioningId === p.id}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: '#B85C2A', color: '#fff', opacity: actioningId === p.id ? 0.6 : 1 }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {data?.totals.map((t) => {
          const sc = STATUS_COLORS[t.status] ?? { bg: '#f5f5f5', color: '#888' }
          return (
            <div key={t.status} className="rounded-xl px-4 py-3 flex-1 min-w-[140px]" style={{ background: sc.bg }}>
              <p className="text-xs font-semibold" style={{ color: sc.color }}>{t.status}</p>
              <p className="text-lg font-bold" style={{ color: sc.color }}>{formatETB(t._sum.amount ?? 0)}</p>
              <p className="text-xs" style={{ color: sc.color }}>{t._count} payment{t._count === 1 ? '' : 's'}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Gateway</th>
                <th className="text-left px-4 py-3">Gateway Ref</th>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Buyer</th>
                <th className="text-left px-4 py-3">Seller</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => {
                const sc = STATUS_COLORS[p.status] ?? { bg: '#f5f5f5', color: '#888' }
                const itemLabel = p.order?.bundleId
                  ? 'Bundle'
                  : p.order?.listing?.title ?? '—'
                return (
                  <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                    <td className="px-4 py-3" style={{ color: '#444' }}>{p.gateway}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#888' }}>
                      {p.gatewayRef ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1a3028' }}>{itemLabel}</td>
                    <td className="px-4 py-3" style={{ color: '#444' }}>{p.order?.buyer?.name ?? '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#444' }}>{p.order?.seller?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#c89b3c' }}>
                      {formatETB(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={sc}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#888' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
              {data?.items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
