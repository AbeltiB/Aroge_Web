'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { Business } from '@arogenpm/sdk'

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Businesses</h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#444' }}>
          <input
            type="checkbox"
            checked={unverifiedOnly}
            onChange={(e) => { setUnverifiedOnly(e.target.checked); load(e.target.checked) }}
            className="rounded"
          />
          Pending verification only
        </label>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Business Name</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Rep</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((b) => (
                <tr key={b.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1a3028' }}>{b.name}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{b.type}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{b.rep?.name}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{b.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={b.verifiedAt
                        ? { background: '#e6f0eb', color: '#1f7a5a' }
                        : { background: '#faeeda', color: '#3d2a10' }}
                    >
                      {b.verifiedAt ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => viewLicense(b.id)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: '#f3efe7', color: '#1f7a5a' }}
                      >
                        View License
                      </button>
                      {!b.verifiedAt && (
                        <button
                          onClick={() => verify(b.id)}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: '#1f7a5a', color: '#f3efe7' }}
                        >
                          Verify
                        </button>
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
