'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { User } from '@arogenpm/sdk'
import { PageHeader, Table, THead, Th, Tr, Td, Badge, Button, Input, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Search, Users as UsersIcon } from 'lucide-react'

interface UsersRes { items: User[]; total: number; page: number }

export default function UsersPage() {
  const [data, setData] = useState<UsersRes | null>(null)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  function load(query = '') {
    setLoading(true)
    api.get<UsersRes>(`/admin/users?q=${encodeURIComponent(query)}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function ban(id: string) {
    if (!confirm('Ban this user?')) return
    await api.patch(`/admin/users/${id}/ban`, {})
    load(q)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Users" subtitle={`${data?.total ?? 0} total`} />

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <Input
          className="pl-9"
          placeholder="Search name or Telegram ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(q)}
        />
      </div>

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={UsersIcon} title="No users found" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Telegram ID</Th>
              <Th>City</Th>
              <Th>Verified</Th>
              <Th>Joined</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((u) => (
              <Tr key={u.id}>
                <Td className="font-semibold text-ink-900">{u.name}</Td>
                <Td>{u.telegramId}</Td>
                <Td>{u.city ?? '—'}</Td>
                <Td><Badge tone={u.verified ? 'brand' : 'neutral'}>{u.verified ? 'Yes' : 'No'}</Badge></Td>
                <Td className="text-ink-400">{new Date(u.createdAt).toLocaleDateString()}</Td>
                <Td className="text-right">
                  {!u.deletedAt ? (
                    <Button size="sm" variant="danger" onClick={() => ban(u.id)}>Ban</Button>
                  ) : (
                    <Badge tone="danger">Banned</Badge>
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
