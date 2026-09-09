'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { PageHeader, Table, THead, Th, Tr, Td, Badge, Pagination, LoadingState, EmptyState, Card } from '../../../components/ui'
import { History } from 'lucide-react'

interface AdminAction {
  id: string
  actionType: string
  targetType: string
  targetId: string
  reason: string | null
  createdAt: string
  admin: { id: string; name: string; telegramId: string }
}

interface AuditLogRes { items: AdminAction[]; total: number; page: number; limit: number }

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogRes | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  function load(p = page) {
    setLoading(true)
    api.get<AuditLogRes>(`/admin/audit-log?page=${p}&limit=30`).then((res) => {
      if (res.success) setData(res.data)
      setPage(p)
      setLoading(false)
    })
  }

  useEffect(() => { load(1) }, [])

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Log" subtitle={`${data?.total ?? 0} actions recorded`} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={History} title="No admin actions yet" /></Card>
      ) : (
        <Table>
          <THead>
            <tr><Th>When</Th><Th>Admin</Th><Th>Action</Th><Th>Target</Th><Th>Reason</Th></tr>
          </THead>
          <tbody>
            {data.items.map((a) => (
              <Tr key={a.id}>
                <Td className="whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</Td>
                <Td className="text-ink-900">{a.admin?.name}</Td>
                <Td><Badge tone="brand">{a.actionType}</Badge></Td>
                <Td>{a.targetType} · {a.targetId}</Td>
                <Td>{a.reason ?? '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {data && data.total > data.limit && <Pagination page={page} total={data.total} limit={data.limit} onChange={load} />}
    </div>
  )
}
