'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Bundles</h2>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={status === s
                ? { background: '#1f7a5a', color: '#f3efe7' }
                : { background: '#f3efe7', color: '#1f7a5a' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : data?.items.length === 0 ? (
        <p className="text-sm text-gray-400">No bundles here.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Seller</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((b) => (
                <tr key={b.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3" style={{ color: '#1a3028' }}>
                    {b.items.map((i) => i.listing.title).join(', ')}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{b.seller.name}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#c89b3c' }}>{formatETB(b.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={b.status === 'FLAGGED'
                        ? { background: 'rgba(184,92,42,0.12)', color: '#B85C2A' }
                        : b.status === 'ARCHIVED'
                        ? { background: '#f5f5f5', color: '#888' }
                        : { background: '#e6f0eb', color: '#1f7a5a' }}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {b.status === 'ACTIVE' && (
                        <>
                          <button disabled={actingId === b.id} onClick={() => act(b.id, 'flag')} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(184,92,42,0.1)', color: '#B85C2A' }}>Flag</button>
                          <button disabled={actingId === b.id} onClick={() => act(b.id, 'remove')} className="text-xs px-2 py-1 rounded" style={{ background: '#f5f5f5', color: '#888' }}>Remove</button>
                        </>
                      )}
                      {b.status === 'FLAGGED' && (
                        <button disabled={actingId === b.id} onClick={() => act(b.id, 'approve')} className="text-xs px-2 py-1 rounded" style={{ background: '#1f7a5a', color: '#f3efe7' }}>Approve</button>
                      )}
                      {b.status === 'ARCHIVED' && (
                        <button disabled={actingId === b.id} onClick={() => act(b.id, 'restore')} className="text-xs px-2 py-1 rounded" style={{ background: '#1f7a5a', color: '#f3efe7' }}>Restore</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
