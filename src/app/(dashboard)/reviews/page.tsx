'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { PageHeader, Select, Table, THead, Th, Tr, Td, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Star } from 'lucide-react'

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
    <div className="space-y-5">
      <PageHeader
        title="Reviews"
        subtitle={`${data?.total ?? 0} total`}
        actions={
          <Select value={maxRating} onChange={(e) => setMaxRating(e.target.value)}>
            <option value="">All ratings</option>
            <option value="2">2★ and below</option>
            <option value="3">3★ and below</option>
          </Select>
        }
      />

      {loading ? <LoadingState /> : !data?.items.length ? (
        <Card><EmptyState icon={Star} title="No reviews yet" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Rating</Th>
              <Th>Comment</Th>
              <Th>From → To</Th>
              <Th>Item</Th>
              <Th>Date</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {data.items.map((r) => (
              <Tr key={r.id}>
                <Td className={r.rating <= 2 ? 'text-action-600' : 'text-value-600'}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </Td>
                <Td className="max-w-xs truncate">{r.comment ?? '—'}</Td>
                <Td>{r.reviewer.name} → {r.reviewee.name}</Td>
                <Td>{r.order.listing?.title ?? 'Bundle'}</Td>
                <Td className="text-xs text-ink-400">{new Date(r.createdAt).toLocaleDateString()}</Td>
                <Td className="text-right">
                  <button
                    onClick={() => removeReview(r.id)}
                    disabled={deletingId === r.id}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-action-100 text-action-700 hover:bg-action-200 transition-colors disabled:opacity-50"
                  >
                    {deletingId === r.id ? '…' : 'Delete'}
                  </button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}
