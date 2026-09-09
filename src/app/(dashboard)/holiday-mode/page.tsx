'use client'

import { useEffect, useState, useCallback } from 'react'
import { PowerOff, RefreshCw, Clock, Palmtree } from 'lucide-react'
import { api } from '../../../lib/api'
import type { HolidayModeLog } from '@arogenpm/sdk'
import { PageHeader, Card, CardHeader, CardTitle, Table, THead, Th, Tr, Td, Button, Badge, Pagination, LoadingState } from '../../../components/ui'

interface ActiveSeller {
  id: string
  name: string
  avatarUrl: string | null
  city: string | null
  holidayModeCount: number
  holidayModeAt: string | null
  _count: { listings: number }
}

interface PageData {
  active: ActiveSeller[]
  logs: (HolidayModeLog & { user: { id: string; name: string; avatarUrl: string | null } })[]
  total: number
  page: number
  limit: number
}

export default function HolidayModePage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [disabling, setDisabling] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const res = await api.get<PageData>(`/admin/holiday-mode?page=${p}&limit=30`)
    if (res.success) { setData(res.data); setPage(p) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function forceDisable(userId: string) {
    if (!confirm('Force-disable holiday mode for this seller?')) return
    setDisabling(userId)
    await api.post(`/admin/holiday-mode/${userId}/disable`, {})
    await load(page)
    setDisabling(null)
  }

  const activeCount = data?.active.length ?? 0
  const totalLogs = data?.total ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><Palmtree size={20} className="text-value-600" />Holiday Mode</span>}
        subtitle={`${activeCount} seller${activeCount !== 1 ? 's' : ''} currently on holiday · ${totalLogs} total log entries`}
        actions={<Button variant="secondary" size="sm" onClick={() => load(page)}><RefreshCw size={13} /> Refresh</Button>}
      />

      <Card className="overflow-hidden">
        <CardHeader className="bg-value-50">
          <div className="flex items-center gap-2">
            <Palmtree size={15} className="text-value-700" />
            <CardTitle className="text-value-900">Currently on Holiday</CardTitle>
          </div>
          {activeCount > 0 && <Badge tone="value">{activeCount} active</Badge>}
        </CardHeader>

        {loading ? <LoadingState /> : activeCount === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">No sellers are currently in holiday mode</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead>
                <tr><Th>Seller</Th><Th>City</Th><Th>Hidden Listings</Th><Th>Times Used</Th><Th>Since</Th><Th>Action</Th></tr>
              </THead>
              <tbody>
                {data!.active.map((s) => (
                  <Tr key={s.id} className="bg-value-50/40">
                    <Td className="font-semibold text-ink-900">{s.name}</Td>
                    <Td>{s.city ?? '—'}</Td>
                    <Td className="font-bold text-center text-action-600">{s._count.listings}</Td>
                    <Td className="text-center">{s.holidayModeCount}</Td>
                    <Td className="text-ink-400">
                      {s.holidayModeAt ? new Date(s.holidayModeAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Td>
                    <Td>
                      <Button size="sm" variant="danger" onClick={() => forceDisable(s.id)} disabled={disabling === s.id}>
                        <PowerOff size={11} /> Force Off
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-brand-600" />
            <CardTitle>Activity Log</CardTitle>
          </div>
          <span className="text-xs text-ink-400">{totalLogs} entries</span>
        </CardHeader>

        {loading ? <LoadingState /> : !data || data.logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">No log entries yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <THead>
                  <tr><Th>Seller</Th><Th>Action</Th><Th>Note</Th><Th>Timestamp</Th></tr>
                </THead>
                <tbody>
                  {data.logs.map((log) => (
                    <Tr key={log.id}>
                      <Td className="font-medium text-ink-900">{log.user.name}</Td>
                      <Td><Badge tone={log.action === 'ON' ? 'value' : 'brand'}>{log.action === 'ON' ? 'ON' : 'OFF'}</Badge></Td>
                      <Td className="max-w-xs truncate">{log.note ?? '—'}</Td>
                      <Td className="text-ink-400">
                        {new Date(log.createdAt).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={totalLogs} limit={30} onChange={load} />
          </>
        )}
      </Card>
    </div>
  )
}
