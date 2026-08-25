'use client'

import { useEffect, useState, useCallback } from 'react'
import { PalmtreeIcon, PowerOff, RefreshCw, Clock } from 'lucide-react'
import { api } from '../../../lib/api'
import type { HolidayModeLog } from 'aroge-sdk'

interface ActiveSeller {
  id: string
  name: string
  avatarUrl: string | null
  city: string | null
  holidayModeCount: number
  holidayModeAt: string | null
  _count: { listings: number }
}

interface PageData {
  active: ActiveSeller[]
  logs: (HolidayModeLog & { user: { id: string; name: string; avatarUrl: string | null } })[]
  total: number
  page: number
  limit: number
}

export default function HolidayModePage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [disabling, setDisabling] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const res = await api.get<PageData>(`/admin/holiday-mode?page=${p}&limit=30`)
    if (res.success) { setData(res.data); setPage(p) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function forceDisable(userId: string) {
    if (!confirm('Force-disable holiday mode for this seller?')) return
    setDisabling(userId)
    await api.post(`/admin/holiday-mode/${userId}/disable`, {})
    await load(page)
    setDisabling(null)
  }

  const activeCount = data?.active.length ?? 0
  const totalLogs = data?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#1a3028' }}>
            <span className="text-2xl">🏖️</span>
            Holiday Mode
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(31,122,90,0.55)' }}>
            {activeCount} seller{activeCount !== 1 ? 's' : ''} currently on holiday · {totalLogs} total log entries
          </p>
        </div>
        <button
          onClick={() => load(page)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
          style={{ background: 'rgba(31,122,90,0.08)', color: '#1f7a5a' }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Currently active */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(31,122,90,0.10)', background: '#faeeda' }}>
          <span className="text-base">🏖️</span>
          <span className="font-semibold text-sm" style={{ color: '#3d2a10' }}>Currently on Holiday</span>
          {activeCount > 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#c89b3c', color: '#fff' }}>
              {activeCount} active
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
        ) : activeCount === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>
            No sellers are currently in holiday mode
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                {['Seller', 'City', 'Hidden Listings', 'Times Used', 'Since', 'Action'].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'rgba(31,122,90,0.55)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data!.active.map((s) => (
                <tr key={s.id} className="border-b last:border-0" style={{ borderColor: 'rgba(31,122,90,0.06)', background: 'rgba(250,238,218,0.3)' }}>
                  <td className="px-5 py-3 font-semibold" style={{ color: '#1a3028' }}>{s.name}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#444444' }}>{s.city ?? '—'}</td>
                  <td className="px-5 py-3 font-bold text-center" style={{ color: '#B85C2A' }}>{s._count.listings}</td>
                  <td className="px-5 py-3 text-center" style={{ color: '#1a3028' }}>{s.holidayModeCount}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'rgba(31,122,90,0.45)' }}>
                    {s.holidayModeAt
                      ? new Date(s.holidayModeAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => forceDisable(s.id)}
                      disabled={disabling === s.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                      style={{ background: 'rgba(184,92,42,0.10)', color: '#B85C2A' }}
                    >
                      <PowerOff size={11} />
                      Force Off
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Full log */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(31,122,90,0.10)' }}>
          <Clock size={14} style={{ color: '#1f7a5a' }} />
          <span className="font-semibold text-sm" style={{ color: '#1a3028' }}>Activity Log</span>
          <span className="ml-auto text-xs" style={{ color: 'rgba(31,122,90,0.45)' }}>{totalLogs} entries</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
        ) : !data || data.logs.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>No log entries yet</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  {['Seller', 'Action', 'Note', 'Timestamp'].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'rgba(31,122,90,0.55)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50" style={{ borderColor: 'rgba(31,122,90,0.06)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: '#1a3028' }}>{log.user.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={log.action === 'ON'
                          ? { background: '#faeeda', color: '#3d2a10' }
                          : { background: '#e6f0eb', color: '#1f7a5a' }}
                      >
                        {log.action === 'ON' ? '🏖️ ON' : '✅ OFF'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs max-w-xs truncate" style={{ color: '#444444' }}>
                      {log.note ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'rgba(31,122,90,0.45)' }}>
                      {new Date(log.createdAt).toLocaleDateString('en-ET', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalLogs > 30 && (
              <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                  style={{ background: 'rgba(31,122,90,0.08)', color: '#1f7a5a' }}
                >
                  ← Previous
                </button>
                <span className="text-xs" style={{ color: 'rgba(31,122,90,0.45)' }}>
                  Page {page} of {Math.ceil(totalLogs / 30)}
                </span>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page * 30 >= totalLogs}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                  style={{ background: 'rgba(31,122,90,0.08)', color: '#1f7a5a' }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
