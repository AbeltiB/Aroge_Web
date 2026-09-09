'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { Business } from '@arogenpm/sdk'
import { PageHeader, Table, THead, Th, Tr, Td, Badge, Button, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Building2 } from 'lucide-react'

interface BusinessesRes { items: (Business & { rep: { id: string; name: string; telegramId: string } })[]; total: number }

export default function BusinessesPage() {
  const [data, setData] = useState<BusinessesRes | null>(null)
  const [unverifiedOnly, setUnverifiedOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  function load(unverified = unverifiedOnly) {
    setLoading(true)
    api.get<BusinessesRes>(`/admin/businesses?unverified=${unverified}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function verify(id: string) {
    await api.post(`/businesses/${id}/verify`, {})
    load(unverifiedOnly)
  }

  async function viewLicense(id: string) {
    const res = await api.get<{ url: string }>(`/businesses/${id}/license-url`)
    if (res.success) window.open(res.data.url, '_blank', 'noopener,noreferrer')
    else alert((res as any).message ?? 'No license on file for this business')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Businesses"
        actions={
          <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unverifiedOnly}
              onChange={(e) => { setUnverifiedOnly(e.target.checked); load(e.target.checked) }}
              className="rounded accent-brand-500"
            />
            Pending verification only
          </label>
        }
      />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={Building2} title="No businesses found" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Business Name</Th>
              <Th>Type</Th>
              <Th>Rep</Th>
              <Th>City</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((b) => (
              <Tr key={b.id}>
                <Td className="font-semibold text-ink-900">{b.name}</Td>
                <Td>{b.type}</Td>
                <Td>{b.rep?.name}</Td>
                <Td>{b.city ?? '—'}</Td>
                <Td><Badge tone={b.verifiedAt ? 'brand' : 'value'}>{b.verifiedAt ? 'Verified' : 'Pending'}</Badge></Td>
                <Td className="text-right">
                  <div className="flex gap-1.5 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => viewLicense(b.id)}>View License</Button>
                    {!b.verifiedAt && <Button size="sm" variant="primary" onClick={() => verify(b.id)}>Verify</Button>}
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
