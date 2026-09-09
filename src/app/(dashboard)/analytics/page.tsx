'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import { PageHeader, StatCard, CardTitle, Table, THead, Th, Tr, Td, LoadingState } from '../../../components/ui'
import { TrendingUp, ShoppingBag, ShieldAlert } from 'lucide-react'

interface AnalyticsData {
  snapshots: Array<{ date: string; gmv: number; orderCount: number; disputeRate: number }>
  totals: { gmv: number; orders: bigint; disputes: bigint }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AnalyticsData>('/admin/analytics').then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingState />

  const totals = data?.totals

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total GMV" value={formatETB(Number(totals?.gmv ?? 0))} icon={TrendingUp} accent="value" />
        <StatCard label="Total Orders" value={String(totals?.orders ?? 0)} icon={ShoppingBag} accent="brand" />
        <StatCard label="Disputes" value={String(totals?.disputes ?? 0)} icon={ShieldAlert} accent="action" />
      </div>

      <div>
        <CardTitle className="mb-3">Daily Snapshots (last 30 days)</CardTitle>
        <Table>
          <THead>
            <tr><Th>Date</Th><Th className="text-right">GMV</Th><Th className="text-right">Orders</Th><Th className="text-right">Dispute Rate</Th></tr>
          </THead>
          <tbody>
            {(data?.snapshots ?? []).map((s) => (
              <Tr key={s.date}>
                <Td className="text-ink-900">{new Date(s.date).toLocaleDateString()}</Td>
                <Td className="text-right font-semibold text-value-700">{formatETB(s.gmv)}</Td>
                <Td className="text-right">{s.orderCount}</Td>
                <Td className="text-right">{(s.disputeRate * 100).toFixed(1)}%</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
