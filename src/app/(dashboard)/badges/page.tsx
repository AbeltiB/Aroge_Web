'use client'

import { useEffect, useState, useCallback } from 'react'
import { BadgeCheck, Settings2, CheckCircle, XCircle, ShieldOff } from 'lucide-react'
import { api } from '../../../lib/api'
import { PageHeader, Card, CardHeader, CardTitle, Table, THead, Th, Tr, Td, Button, Toggle, Input, Badge, LoadingState } from '../../../components/ui'

interface BadgeCriteria {
  id: string
  minSales: number
  minPurchases: number
  requireBoth: boolean
}

interface ReviewUser {
  id: string
  name: string
  avatarUrl: string | null
  city: string | null
  createdAt: string
  isTrusted: boolean
  badgePendingReview: boolean
  _count: { buyerOrders: number; sellerOrders: number }
}

interface TrustedUser {
  id: string
  name: string
  avatarUrl: string | null
  city: string | null
  trustedAt: string | null
  _count: { buyerOrders: number; sellerOrders: number }
}

interface ReviewPage { items: ReviewUser[]; total: number }

const AmharicA = ({ className = '' }: { className?: string }) => (
  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-value-400 text-white flex-shrink-0 ${className}`}>አ</span>
)

export default function BadgesPage() {
  const [critForm, setCritForm] = useState({ minSales: 5, minPurchases: 3, requireBoth: false })
  const [savingCrit, setSavingCrit] = useState(false)
  const [critSaved, setCritSaved] = useState(false)

  const [reviews, setReviews] = useState<ReviewUser[]>([])
  const [reviewTotal, setReviewTotal] = useState(0)
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [trusted, setTrusted] = useState<TrustedUser[]>([])
  const [loadingTrusted, setLoadingTrusted] = useState(true)

  const [acting, setActing] = useState<string | null>(null)

  const loadCriteria = useCallback(async () => {
    const res = await api.get<BadgeCriteria>('/admin/badge-criteria')
    if (res.success) setCritForm({ minSales: res.data.minSales, minPurchases: res.data.minPurchases, requireBoth: res.data.requireBoth })
  }, [])

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true)
    const res = await api.get<ReviewPage>('/admin/badge-reviews?limit=30')
    if (res.success) { setReviews(res.data.items); setReviewTotal(res.data.total) }
    setLoadingReviews(false)
  }, [])

  const loadTrusted = useCallback(async () => {
    setLoadingTrusted(true)
    const res = await api.get<{ items: TrustedUser[]; total: number }>('/admin/users?trusted=true&limit=30')
    if (res.success) setTrusted(res.data.items.filter((u: any) => u.isTrusted))
    setLoadingTrusted(false)
  }, [])

  useEffect(() => {
    loadCriteria()
    loadReviews()
    loadTrusted()
  }, [loadCriteria, loadReviews, loadTrusted])

  async function saveCriteria() {
    setSavingCrit(true)
    const res = await api.patch('/admin/badge-criteria', critForm)
    if (res.success) { setCritSaved(true); setTimeout(() => setCritSaved(false), 2500) }
    setSavingCrit(false)
  }

  async function grant(userId: string) {
    setActing(userId)
    await api.post(`/admin/badge-reviews/${userId}/grant`, {})
    await loadReviews()
    await loadTrusted()
    setActing(null)
  }

  async function dismiss(userId: string) {
    setActing(userId)
    await api.post(`/admin/badge-reviews/${userId}/dismiss`, {})
    setReviews((prev) => prev.filter((u) => u.id !== userId))
    setActing(null)
  }

  async function revoke(userId: string) {
    if (!confirm('Revoke trusted badge from this user?')) return
    setActing(userId)
    await api.post(`/admin/badge-reviews/${userId}/revoke`, {})
    setTrusted((prev) => prev.filter((u) => u.id !== userId))
    setActing(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><AmharicA className="w-7 h-7 text-sm" />Trusted Badge</span>}
        subtitle="Manage badge criteria and review pending applications"
      />

      <Card padded className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 size={15} className="text-brand-600" />
          <CardTitle>Badge Criteria</CardTitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1 text-ink-700">Min. Completed Sales</label>
            <Input type="number" min={0} value={critForm.minSales} onChange={(e) => setCritForm((f) => ({ ...f, minSales: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-ink-700">Min. Completed Purchases</label>
            <Input type="number" min={0} value={critForm.minPurchases} onChange={(e) => setCritForm((f) => ({ ...f, minPurchases: Number(e.target.value) }))} />
          </div>
          <div className="flex items-center gap-2 pb-2.5">
            <Toggle checked={critForm.requireBoth} onChange={() => setCritForm((f) => ({ ...f, requireBoth: !f.requireBoth }))} />
            <span className="text-xs font-medium text-ink-700">Require both sales AND purchases</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="primary" onClick={saveCriteria} disabled={savingCrit}>{savingCrit ? 'Saving…' : 'Save Criteria'}</Button>
          {critSaved && <span className="text-xs font-semibold flex items-center gap-1 text-brand-600"><CheckCircle size={13} /> Saved</span>}
          <p className="text-xs text-ink-400 sm:ml-auto">The system checks eligibility automatically on each completed order</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BadgeCheck size={14} className="text-value-600" />
            <CardTitle>Pending Review</CardTitle>
          </div>
          {reviewTotal > 0 && <Badge tone="value">{reviewTotal} waiting</Badge>}
        </CardHeader>

        {loadingReviews ? <LoadingState /> : reviews.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">No pending reviews</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead>
                <tr>
                  <Th>User</Th><Th>City</Th><Th>Completed Sales</Th><Th>Completed Purchases</Th><Th>Actions</Th>
                </tr>
              </THead>
              <tbody>
                {reviews.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="font-semibold text-ink-900">{u.name}</div>
                      <div className="text-xs mt-0.5 text-ink-400">Joined {new Date(u.createdAt).toLocaleDateString('en-ET', { month: 'short', year: 'numeric' })}</div>
                    </Td>
                    <Td>{u.city ?? '—'}</Td>
                    <Td className="font-bold text-center text-brand-600">{u._count.sellerOrders}</Td>
                    <Td className="font-bold text-center text-brand-600">{u._count.buyerOrders}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" className="!bg-value-400 !text-white !border-transparent hover:!bg-value-500" onClick={() => grant(u.id)} disabled={acting === u.id}>
                          Grant Badge
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => dismiss(u.id)} disabled={acting === u.id}>
                          <XCircle size={12} /> Dismiss
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AmharicA className="w-5 h-5 text-[10px]" />
            <CardTitle>Trusted Members</CardTitle>
          </div>
        </CardHeader>

        {loadingTrusted ? <LoadingState /> : trusted.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">No trusted members yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead>
                <tr><Th>User</Th><Th>City</Th><Th>Sales</Th><Th>Purchases</Th><Th>Trusted Since</Th><Th /></tr>
              </THead>
              <tbody>
                {trusted.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <AmharicA className="w-5 h-5 text-[10px]" />
                        <span className="font-semibold text-ink-900">{u.name}</span>
                      </div>
                    </Td>
                    <Td>{u.city ?? '—'}</Td>
                    <Td className="font-semibold text-center text-brand-600">{u._count.sellerOrders}</Td>
                    <Td className="font-semibold text-center text-brand-600">{u._count.buyerOrders}</Td>
                    <Td className="text-ink-400">
                      {u.trustedAt ? new Date(u.trustedAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </Td>
                    <Td>
                      <Button size="sm" variant="danger" onClick={() => revoke(u.id)} disabled={acting === u.id}>
                        <ShieldOff size={11} /> Revoke
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
