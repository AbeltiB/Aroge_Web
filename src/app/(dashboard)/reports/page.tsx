'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

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

const TARGET_COLORS: Record<string, { bg: string; color: string }> = {
  LISTING: { bg: '#e6f0eb', color: '#1f7a5a' },
  USER: { bg: '#faeeda', color: '#3d2a10' },
  MESSAGE: { bg: 'rgba(184,92,42,0.1)', color: '#B85C2A' },
}

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
    if (res.success) {
      await api.patch(`/reports/${report.id}`, { status: 'REVIEWED' })
    } else {
      alert((res as any).message ?? 'Could not flag listing')
    }
    setActingId(null)
    load(status)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Reports</h2>
        <span className="text-sm" style={{ color: '#444' }}>{data?.total ?? 0} results</span>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'REVIEWED', 'DISMISSED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); load(s) }}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={status === s
              ? { background: '#1f7a5a', color: '#f3efe7' }
              : { background: '#f3efe7', color: '#1f7a5a' }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-left px-4 py-3">Reporter</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => {
                const tc = TARGET_COLORS[r.targetType]
                return (
                  <tr key={r.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={tc}>{r.targetType}</span>
                      <span className="ml-2 font-mono text-xs" style={{ color: '#888' }}>{r.targetId.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3 max-w-sm" style={{ color: '#444' }}>{r.reason}</td>
                    <td className="px-4 py-3" style={{ color: '#444' }}>{r.reporter?.name ?? '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#888' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          {r.targetType === 'LISTING' && (
                            <button
                              onClick={() => flagListing(r)}
                              disabled={actingId === r.id}
                              className="text-xs px-2 py-1 rounded"
                              style={{ color: '#3d2a10', background: '#faeeda' }}
                            >
                              Flag Listing
                            </button>
                          )}
                          <button
                            onClick={() => setReportStatus(r.id, 'REVIEWED')}
                            disabled={actingId === r.id}
                            className="text-xs px-2 py-1 rounded"
                            style={{ color: '#1f7a5a', background: 'rgba(31,122,90,0.1)' }}
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => setReportStatus(r.id, 'DISMISSED')}
                            disabled={actingId === r.id}
                            className="text-xs px-2 py-1 rounded"
                            style={{ color: '#888', background: '#f5f5f5' }}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {data?.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No reports here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
