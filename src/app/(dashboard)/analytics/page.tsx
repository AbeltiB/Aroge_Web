'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from 'aroge-sdk'

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

  if (loading) return <div className="text-sm" style={{ color: '#444' }}>Loading…</div>

  const totals = data?.totals

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Analytics</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total GMV', value: formatETB(Number(totals?.gmv ?? 0)) },
          { label: 'Total Orders', value: String(totals?.orders ?? 0) },
          { label: 'Disputes', value: String(totals?.disputes ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(31,122,90,0.45)' }}>
              {label}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#1a3028' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a3028' }}>Daily Snapshots (last 30 days)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'rgba(31,122,90,0.6)' }}>
              <th className="text-left pb-2">Date</th>
              <th className="text-right pb-2">GMV</th>
              <th className="text-right pb-2">Orders</th>
              <th className="text-right pb-2">Dispute Rate</th>
            </tr>
          </thead>
          <tbody>
            {(data?.snapshots ?? []).map((s) => (
              <tr key={s.date} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                <td className="py-1.5" style={{ color: '#1a3028' }}>
                  {new Date(s.date).toLocaleDateString()}
                </td>
                <td className="text-right" style={{ color: '#c89b3c' }}>{formatETB(s.gmv)}</td>
                <td className="text-right" style={{ color: '#444' }}>{s.orderCount}</td>
                <td className="text-right" style={{ color: '#444' }}>
                  {(s.disputeRate * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
