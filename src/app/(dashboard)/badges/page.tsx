'use client'

import { useEffect, useState, useCallback } from 'react'
import { BadgeCheck, Settings2, CheckCircle, XCircle, ShieldOff } from 'lucide-react'
import { api } from '../../../lib/api'

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

export default function BadgesPage() {
  const [criteria, setCriteria] = useState<BadgeCriteria | null>(null)
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
    if (res.success) {
      setCriteria(res.data)
      setCritForm({ minSales: res.data.minSales, minPurchases: res.data.minPurchases, requireBoth: res.data.requireBoth })
    }
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
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#1a3028' }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black" style={{ background: '#c89b3c', color: '#fff' }}>አ</span>
          Trusted Badge
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(31,122,90,0.55)' }}>
          Manage badge criteria and review pending applications
        </p>
      </div>

      {/* Criteria settings */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
        <div className="flex items-center gap-2">
          <Settings2 size={15} style={{ color: '#1f7a5a' }} />
          <h2 className="font-semibold text-sm" style={{ color: '#1a3028' }}>Badge Criteria</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#1a3028' }}>Min. Completed Sales</label>
            <input
              type="number" min={0}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
              value={critForm.minSales}
              onChange={(e) => setCritForm((f) => ({ ...f, minSales: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#1a3028' }}>Min. Completed Purchases</label>
            <input
              type="number" min={0}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
              value={critForm.minPurchases}
              onChange={(e) => setCritForm((f) => ({ ...f, minPurchases: Number(e.target.value) }))}
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => setCritForm((f) => ({ ...f, requireBoth: !f.requireBoth }))}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{ background: critForm.requireBoth ? '#1f7a5a' : 'rgba(31,122,90,0.2)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: critForm.requireBoth ? '1.25rem' : '0.125rem' }}
              />
            </button>
            <span className="text-xs font-medium" style={{ color: '#1a3028' }}>
              Require both sales AND purchases
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveCriteria}
            disabled={savingCrit}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: '#1f7a5a', color: '#f3efe7' }}
          >
            {savingCrit ? 'Saving…' : 'Save Criteria'}
          </button>
          {critSaved && (
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#1f7a5a' }}>
              <CheckCircle size={13} /> Saved
            </span>
          )}
          <p className="text-xs ml-auto" style={{ color: 'rgba(31,122,90,0.45)' }}>
            The system checks eligibility automatically on each completed order
          </p>
        </div>
      </div>

      {/* Pending reviews */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(31,122,90,0.10)' }}>
          <div className="flex items-center gap-2">
            <BadgeCheck size={14} style={{ color: '#c89b3c' }} />
            <span className="font-semibold text-sm" style={{ color: '#1a3028' }}>Pending Review</span>
          </div>
          {reviewTotal > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#faeeda', color: '#3d2a10' }}>
              {reviewTotal} waiting
            </span>
          )}
        </div>

        {loadingReviews ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>No pending reviews</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                {['User', 'City', 'Completed Sales', 'Completed Purchases', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'rgba(31,122,90,0.55)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((u) => (
                <tr key={u.id} className="border-b last:border-0" style={{ borderColor: 'rgba(31,122,90,0.06)' }}>
                  <td className="px-5 py-3">
                    <div className="font-semibold" style={{ color: '#1a3028' }}>{u.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(31,122,90,0.45)' }}>
                      Joined {new Date(u.createdAt).toLocaleDateString('en-ET', { month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#444444' }}>{u.city ?? '—'}</td>
                  <td className="px-5 py-3 font-bold text-center" style={{ color: '#1f7a5a' }}>{u._count.sellerOrders}</td>
                  <td className="px-5 py-3 font-bold text-center" style={{ color: '#1f7a5a' }}>{u._count.buyerOrders}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => grant(u.id)}
                        disabled={acting === u.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: '#c89b3c', color: '#3d2a10' }}
                      >
                        <span className="font-black">አ</span>
                        Grant Badge
                      </button>
                      <button
                        onClick={() => dismiss(u.id)}
                        disabled={acting === u.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: 'rgba(31,122,90,0.08)', color: '#1a3028' }}
                      >
                        <XCircle size={12} />
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Trusted users list */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(31,122,90,0.10)' }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#c89b3c', color: '#fff' }}>አ</span>
          <span className="font-semibold text-sm" style={{ color: '#1a3028' }}>Trusted Members</span>
        </div>

        {loadingTrusted ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
        ) : trusted.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>No trusted members yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                {['User', 'City', 'Sales', 'Purchases', 'Trusted Since', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'rgba(31,122,90,0.55)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trusted.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50" style={{ borderColor: 'rgba(31,122,90,0.06)' }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: '#c89b3c', color: '#fff' }}>አ</span>
                      <span className="font-semibold" style={{ color: '#1a3028' }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#444444' }}>{u.city ?? '—'}</td>
                  <td className="px-5 py-3 font-semibold text-center" style={{ color: '#1f7a5a' }}>{u._count.sellerOrders}</td>
                  <td className="px-5 py-3 font-semibold text-center" style={{ color: '#1f7a5a' }}>{u._count.buyerOrders}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'rgba(31,122,90,0.45)' }}>
                    {u.trustedAt ? new Date(u.trustedAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => revoke(u.id)}
                      disabled={acting === u.id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
                      style={{ color: '#B85C2A', background: 'rgba(184,92,42,0.08)' }}
                    >
                      <ShieldOff size={11} />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
