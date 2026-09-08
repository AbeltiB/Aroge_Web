'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { User } from '@arogenpm/sdk'

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Users</h2>
        <span className="text-sm" style={{ color: '#444' }}>{data?.total ?? 0} total</span>
      </div>

      <input
        className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none"
        style={{ borderColor: 'rgba(31,122,90,0.12)' }}
        placeholder="Search name or Telegram ID…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && load(q)}
      />

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Telegram ID</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-left px-4 py-3">Verified</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1a3028' }}>{u.name}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{u.telegramId}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{u.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={u.verified
                        ? { background: '#e6f0eb', color: '#1f7a5a' }
                        : { background: '#f5f5f5', color: '#888' }}
                    >
                      {u.verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#888' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!u.deletedAt && (
                      <button
                        onClick={() => ban(u.id)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: '#B85C2A', background: 'rgba(184,92,42,0.08)' }}
                      >
                        Ban
                      </button>
                    )}
                    {u.deletedAt && (
                      <span className="text-xs text-red-400">Banned</span>
                    )}
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
