'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

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
      setLoading(false)
    })
  }

  useEffect(() => { load(1) }, [])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Audit Log</h2>
        <p className="text-sm" style={{ color: 'rgba(31,122,90,0.5)' }}>{data?.total ?? 0} actions recorded</p>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#444' }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#1a3028' }}>{a.admin?.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#e6f0eb', color: '#1f7a5a' }}>
                      {a.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{a.targetType} · {a.targetId}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{a.reason ?? '—'}</td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No admin actions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm" style={{ color: '#444' }}>
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); load(p) }}
            className="px-3 py-1 rounded disabled:opacity-40"
            style={{ background: '#f3efe7' }}
          >
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => { const p = page + 1; setPage(p); load(p) }}
            className="px-3 py-1 rounded disabled:opacity-40"
            style={{ background: '#f3efe7' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
