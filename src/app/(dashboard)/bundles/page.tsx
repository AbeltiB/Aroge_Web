'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import { PageHeader, FilterChips, Table, THead, Th, Tr, Td, StatusBadge, Button, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Boxes } from 'lucide-react'

interface AdminBundle {
  id: string
  price: number
  status: string
  createdAt: string
  seller: { id: string; name: string }
  items: { listing: { id: string; title: string } }[]
}

interface BundlesRes { items: AdminBundle[]; total: number; page: number; limit: number }

const STATUS_FILTERS = ['ACTIVE', 'FLAGGED', 'ARCHIVED', 'ALL']

export default function BundlesPage() {
  const [data, setData] = useState<BundlesRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('ACTIVE')
  const [actingId, setActingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.get<BundlesRes>(`/admin/bundles?status=${status}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [status])

  async function act(id: string, action: 'flag' | 'approve' | 'remove' | 'restore') {
    if (action === 'remove' && !confirm('Remove this bundle from the marketplace?')) return
    setActingId(id)
    const res = await api.patch(`/admin/bundles/${id}/${action}`, {})
    setActingId(null)
    if (!res.success) alert((res as any).message ?? 'Action failed')
    load()
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Bundles" subtitle={`${data?.total ?? 0} total`} />

      <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={Boxes} title="No bundles here" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Items</Th>
              <Th>Seller</Th>
              <Th>Price</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((b) => (
              <Tr key={b.id}>
                <Td className="text-ink-900">{b.items.map((i) => i.listing.title).join(', ')}</Td>
                <Td>{b.seller.name}</Td>
                <Td className="font-semibold text-value-700">{formatETB(b.price)}</Td>
                <Td><StatusBadge status={b.status} /></Td>
                <Td className="text-right">
                  <div className="flex gap-1.5 justify-end">
                    {b.status === 'ACTIVE' && (
                      <>
                        <Button size="sm" variant="danger" disabled={actingId === b.id} onClick={() => act(b.id, 'flag')}>Flag</Button>
                        <Button size="sm" variant="ghost" disabled={actingId === b.id} onClick={() => act(b.id, 'remove')}>Remove</Button>
                      </>
                    )}
                    {b.status === 'FLAGGED' && (
                      <Button size="sm" variant="primary" disabled={actingId === b.id} onClick={() => act(b.id, 'approve')}>Approve</Button>
                    )}
                    {b.status === 'ARCHIVED' && (
                      <Button size="sm" variant="primary" disabled={actingId === b.id} onClick={() => act(b.id, 'restore')}>Restore</Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
