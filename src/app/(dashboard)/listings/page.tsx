'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from 'aroge-sdk'
import type { Listing } from 'aroge-sdk'

interface ListingsRes { items: (Listing & { seller?: { id: string; name: string } })[]; total: number }

const TABS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'RESERVED', label: 'Reserved' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'FLAGGED', label: 'Flagged' },
  { key: 'REMOVED', label: 'Removed' },
]

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Listings</h2>
        <span className="text-sm" style={{ color: '#444' }}>{data?.total ?? 0} results</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); load(t.key) }}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={tab === t.key
              ? { background: '#1f7a5a', color: '#f3efe7' }
              : { background: '#f3efe7', color: '#1f7a5a' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Seller</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Condition</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-left px-4 py-3">Listed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((l) => (
                <tr key={l.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3 font-medium max-w-xs truncate" style={{ color: '#1a3028' }}>
                    {l.title}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{l.seller?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#c89b3c' }}>
                    {formatETB(l.price)}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{l.condition}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{l.city ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#888' }}>
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {tab === 'FLAGGED' && (
                        <button
                          onClick={() => approve(l.id)}
                          disabled={actingId === l.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: '#1f7a5a', background: 'rgba(31,122,90,0.1)' }}
                        >
                          Approve
                        </button>
                      )}
                      {tab === 'REMOVED' && (
                        <button
                          onClick={() => restore(l.id)}
                          disabled={actingId === l.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: '#1f7a5a', background: 'rgba(31,122,90,0.1)' }}
                        >
                          Restore
                        </button>
                      )}
                      {tab !== 'FLAGGED' && tab !== 'REMOVED' && (
                        <button
                          onClick={() => flag(l.id)}
                          disabled={actingId === l.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: '#3d2a10', background: '#faeeda' }}
                        >
                          Flag
                        </button>
                      )}
                      {tab !== 'REMOVED' && (
                        <button
                          onClick={() => remove(l.id)}
                          disabled={actingId === l.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: '#B85C2A', background: 'rgba(184,92,42,0.08)' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No listings here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
