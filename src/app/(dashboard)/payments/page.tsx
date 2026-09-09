'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import { PageHeader, FilterChips, Table, THead, Th, Tr, Td, StatusBadge, Button, Card, LoadingState, EmptyState } from '../../../components/ui'
import { Wallet, AlertTriangle } from 'lucide-react'

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
    <div className="space-y-5">
      <PageHeader title="Payments" subtitle={`${data?.total ?? 0} total`} />

      {pendingTransfers.length > 0 && (
        <Card padded className="space-y-3 border-l-4 border-l-value-400">
          <h3 className="text-sm font-bold text-value-800 flex items-center gap-2">
            <AlertTriangle size={15} />
            Bank Transfers Awaiting Verification ({pendingTransfers.length})
          </h3>
          <div className="space-y-2">
            {pendingTransfers.map((p) => {
              const itemLabel = p.order?.bundleId ? 'Bundle' : p.order?.listing?.title ?? '—'
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 bg-value-50">
                  <div className="text-sm text-value-900">
                    <span className="font-semibold">{p.order?.buyer?.name ?? '—'}</span> · {itemLabel} · {formatETB(p.amount)}
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => viewProof(p.id)}>View Proof</Button>
                    <Button size="sm" variant="primary" onClick={() => verifyTransfer(p.id)} disabled={actioningId === p.id}>Verify</Button>
                    <Button size="sm" variant="danger" onClick={() => rejectTransfer(p.id)} disabled={actioningId === p.id}>Reject</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        {data?.totals.map((t) => (
          <div key={t.status} className="rounded-xl px-4 py-3 flex-1 min-w-[140px] bg-white border border-canvas-300/60 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{t.status}</p>
            <p className="text-lg font-bold text-ink-900 mt-0.5 tabular-nums">{formatETB(t._sum.amount ?? 0)}</p>
            <p className="text-xs text-ink-400">{t._count} payment{t._count === 1 ? '' : 's'}</p>
          </div>
        ))}
      </div>

      <FilterChips options={STATUSES} value={status} onChange={(s) => { setStatus(s); load(s) }} labels={{ '': 'All' }} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={Wallet} title="No payments yet" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Gateway</Th>
              <Th>Gateway Ref</Th>
              <Th>Item</Th>
              <Th>Buyer</Th>
              <Th>Seller</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <tbody>
            {data.items.map((p) => {
              const itemLabel = p.order?.bundleId ? 'Bundle' : p.order?.listing?.title ?? '—'
              return (
                <Tr key={p.id}>
                  <Td>{p.gateway}</Td>
                  <Td className="font-mono text-xs text-ink-400">{p.gatewayRef ?? '—'}</Td>
                  <Td className="text-ink-900">{itemLabel}</Td>
                  <Td>{p.order?.buyer?.name ?? '—'}</Td>
                  <Td>{p.order?.seller?.name ?? '—'}</Td>
                  <Td className="font-semibold text-value-700">{formatETB(p.amount)}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td className="text-ink-400">{new Date(p.createdAt).toLocaleDateString()}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </div>
  )
}
