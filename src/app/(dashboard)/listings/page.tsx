'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import type { Listing } from '@arogenpm/sdk'
import { PageHeader, FilterChips, Table, THead, Th, Tr, Td, Button, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Package } from 'lucide-react'

interface ListingsRes { items: (Listing & { seller?: { id: string; name: string } })[]; total: number }

const TABS = ['ACTIVE', 'DRAFT', 'RESERVED', 'SOLD', 'FLAGGED', 'REMOVED']
const TAB_LABELS: Record<string, string> = {
  ACTIVE: 'Active', DRAFT: 'Draft', RESERVED: 'Reserved', SOLD: 'Sold', FLAGGED: 'Flagged', REMOVED: 'Removed',
}

export default function ListingsPage() {
  const [data, setData] = useState<ListingsRes | null>(null)
  const [tab, setTab] = useState('ACTIVE')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  function load(t = tab) {
    setLoading(true)
    const qs = t === 'REMOVED' ? 'removed=true' : `status=${t}`
    api.get<ListingsRes>(`/admin/listings?${qs}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function remove(id: string) {
    if (!confirm('Remove this listing? It will no longer be visible anywhere.')) return
    setActingId(id)
    await api.patch(`/admin/listings/${id}/remove`, {})
    setActingId(null)
    load(tab)
  }

  async function flag(id: string) {
    const reason = prompt('Reason for flagging this listing (shown in audit log):')
    if (reason === null) return
    setActingId(id)
    const res = await api.patch(`/admin/listings/${id}/flag`, reason ? { reason } : {})
    setActingId(null)
    if (!res.success) alert((res as any).message ?? 'Could not flag listing')
    load(tab)
  }

  async function approve(id: string) {
    setActingId(id)
    const res = await api.patch(`/admin/listings/${id}/approve`, {})
    setActingId(null)
    if (!res.success) alert((res as any).message ?? 'Could not approve listing')
    load(tab)
  }

  async function restore(id: string) {
    setActingId(id)
    const res = await api.patch(`/admin/listings/${id}/restore`, {})
    setActingId(null)
    if (!res.success) alert((res as any).message ?? 'Could not restore listing')
    load(tab)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Listings" subtitle={`${data?.total ?? 0} results`} />

      <FilterChips options={TABS} value={tab} onChange={(t) => { setTab(t); load(t) }} labels={TAB_LABELS} />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={Package} title="No listings here" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Title</Th>
              <Th>Seller</Th>
              <Th>Price</Th>
              <Th>Condition</Th>
              <Th>City</Th>
              <Th>Listed</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((l) => (
              <Tr key={l.id}>
                <Td className="font-semibold max-w-xs truncate text-ink-900">{l.title}</Td>
                <Td>{l.seller?.name ?? '—'}</Td>
                <Td className="font-semibold text-value-700">{formatETB(l.price)}</Td>
                <Td>{l.condition}</Td>
                <Td>{l.city ?? '—'}</Td>
                <Td className="text-ink-400">{new Date(l.createdAt).toLocaleDateString()}</Td>
                <Td className="text-right">
                  <div className="flex gap-1.5 justify-end">
                    {tab === 'FLAGGED' && (
                      <Button size="sm" variant="primary" onClick={() => approve(l.id)} disabled={actingId === l.id}>Approve</Button>
                    )}
                    {tab === 'REMOVED' && (
                      <Button size="sm" variant="primary" onClick={() => restore(l.id)} disabled={actingId === l.id}>Restore</Button>
                    )}
                    {tab !== 'FLAGGED' && tab !== 'REMOVED' && (
                      <Button size="sm" variant="secondary" className="!bg-value-100 !text-value-800 !border-transparent" onClick={() => flag(l.id)} disabled={actingId === l.id}>Flag</Button>
                    )}
                    {tab !== 'REMOVED' && (
                      <Button size="sm" variant="danger" onClick={() => remove(l.id)} disabled={actingId === l.id}>Remove</Button>
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
