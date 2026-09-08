'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

interface AdminReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  reviewer: { id: string; name: string }
  reviewee: { id: string; name: string }
  order: { id: string; listing: { id: string; title: string } | null; bundleId: string | null }
}

interface ReviewsRes { items: AdminReview[]; total: number; page: number; limit: number }

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [maxRating, setMaxRating] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    const query = maxRating ? `?maxRating=${maxRating}` : ''
    api.get<ReviewsRes>(`/admin/reviews${query}`).then((res) => {
      if (res.success) setData(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [maxRating])

  async function removeReview(id: string) {
    if (!confirm('Delete this review permanently?')) return
    setDeletingId(id)
    await api.delete(`/admin/reviews/${id}`)
    setDeletingId(null)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Reviews</h2>
        <select
          value={maxRating}
          onChange={(e) => setMaxRating(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 bg-white"
          style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
        >
          <option value="">All ratings</option>
          <option value="2">2★ and below</option>
          <option value="3">3★ and below</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : data?.items.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Comment</th>
                <th className="text-left px-4 py-3">From → To</th>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3">
                    <span style={{ color: r.rating <= 2 ? '#B85C2A' : '#c89b3c' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" style={{ color: '#444' }}>{r.comment ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{r.reviewer.name} → {r.reviewee.name}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{r.order.listing?.title ?? 'Bundle'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#888' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeReview(r.id)}
                      disabled={deletingId === r.id}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(184,92,42,0.1)', color: '#B85C2A' }}
                    >
                      {deletingId === r.id ? '…' : 'Delete'}
                    </button>
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
