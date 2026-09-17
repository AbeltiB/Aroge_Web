'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import type { Order } from '@arogenpm/sdk'
import { PageHeader, FilterChips, Table, THead, Th, Tr, Td, StatusBadge, LoadingState, EmptyState, Card } from '../../../components/ui'
import { ShoppingBag } from 'lucide-react'

interface OrdersRes { items: Order[]; total: number }
interface StatusCountsRes { total: number; counts: Record<string, number> }

const STATUSES = ['', 'PENDING_PAYMENT', 'PAID_ESCROWED', 'IN_TRANSIT', 'COMPLETED', 'DISPUTED', 'REFUNDED']
const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending', PAID_ESCROWED: 'Escrow', IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed', DISPUTED: 'Disputed', REFUNDED: 'Refunded',
}

export default function OrdersPage() {
  const [data, setData] = useState<OrdersRes | null>(null)
  const [statusCounts, setStatusCounts] = useState<StatusCountsRes | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  function load(s = status) {
    setLoading(true)
    api.get<OrdersRes>(`/admin/orders${s ? `?status=${s}` : ''}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  function loadCounts() {
    api.get<StatusCountsRes>('/admin/orders/status-counts').then((res) => {
      if (res.success) setStatusCounts(res.data)
    })
  }

  useEffect(() => { load(); loadCounts() }, [])

  const chipLabels = Object.fromEntries(STATUSES.map((s) => {
    const count = s ? statusCounts?.counts[s] ?? 0 : statusCounts?.total ?? 0
    const label = s ? STATUS_LABELS[s] : 'All'
    return [s, `${label} (${count})`]
  }))

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" subtitle={`${data?.total ?? 0} total`} />

      <FilterChips options={STATUSES} value={status} onChange={(s) => { setStatus(s); load(s) }} labels={chipLabels} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={ShoppingBag} title="No orders" subtitle="Orders will show up here once buyers start checking out." /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Order ID</Th>
              <Th>Amount</Th>
              <Th>Method</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <tbody>
            {data.items.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/orders/${o.id}`} className="font-mono text-xs text-ink-400 hover:text-brand-600 hover:underline">
                    {o.id.slice(0, 8)}…
                  </Link>
                </Td>
                <Td className="font-semibold text-value-700 tabular-nums">{formatETB(o.amount)}</Td>
                <Td>{o.paymentMethod}</Td>
                <Td><StatusBadge status={o.orderStatus} /></Td>
                <Td className="text-ink-400">{new Date(o.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
