'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { PageHeader, FilterChips, Table, THead, Th, Tr, Td, Badge, Button, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Flag } from 'lucide-react'
import type { BadgeTone } from '../../../components/ui'

interface Report {
  id: string
  targetType: 'LISTING' | 'USER' | 'MESSAGE'
  targetId: string
  reason: string
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  reporter: { id: string; name: string } | null
  createdAt: string
}

interface ReportsRes { items: Report[]; total: number }

const TARGET_TONES: Record<string, BadgeTone> = { LISTING: 'brand', USER: 'value', MESSAGE: 'action' }

export default function ReportsPage() {
  const [data, setData] = useState<ReportsRes | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  function load(s = status) {
    setLoading(true)
    api.get<ReportsRes>(`/reports?status=${s}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function setReportStatus(id: string, next: 'REVIEWED' | 'DISMISSED') {
    setActingId(id)
    await api.patch(`/reports/${id}`, { status: next })
    setActingId(null)
    load(status)
  }

  async function flagListing(report: Report) {
    setActingId(report.id)
    const res = await api.patch(`/admin/listings/${report.targetId}/flag`, { reason: report.reason })
    if (res.success) await api.patch(`/reports/${report.id}`, { status: 'REVIEWED' })
    else alert((res as any).message ?? 'Could not flag listing')
    setActingId(null)
    load(status)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle={`${data?.total ?? 0} results`} />

      <FilterChips options={['PENDING', 'REVIEWED', 'DISMISSED']} value={status} onChange={(s) => { setStatus(s); load(s) }} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={Flag} title="No reports here" /></Card>
      ) : (
        <Table>
          <THead>
            <tr><Th>Target</Th><Th>Reason</Th><Th>Reporter</Th><Th>Date</Th><Th /></tr>
          </THead>
          <tbody>
            {data.items.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <Badge tone={TARGET_TONES[r.targetType]}>{r.targetType}</Badge>
                  <span className="ml-2 font-mono text-xs text-ink-400">{r.targetId.slice(0, 8)}…</span>
                </Td>
                <Td className="max-w-sm">{r.reason}</Td>
                <Td>{r.reporter?.name ?? '—'}</Td>
                <Td className="text-ink-400">{new Date(r.createdAt).toLocaleDateString()}</Td>
                <Td className="text-right">
                  {r.status === 'PENDING' && (
                    <div className="flex gap-1.5 justify-end">
                      {r.targetType === 'LISTING' && (
                        <Button size="sm" variant="secondary" className="!bg-value-100 !text-value-800 !border-transparent" onClick={() => flagListing(r)} disabled={actingId === r.id}>
                          Flag Listing
                        </Button>
                      )}
                      <Button size="sm" variant="primary" onClick={() => setReportStatus(r.id, 'REVIEWED')} disabled={actingId === r.id}>Mark Reviewed</Button>
                      <Button size="sm" variant="ghost" onClick={() => setReportStatus(r.id, 'DISMISSED')} disabled={actingId === r.id}>Dismiss</Button>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
