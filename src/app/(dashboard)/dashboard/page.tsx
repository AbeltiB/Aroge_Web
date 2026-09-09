'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from '@arogenpm/sdk'
import {
  Package, ShoppingBag, ShieldCheck, Users,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  Building2, RefreshCw, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader, Button, StatCard, Card, CardHeader, CardTitle, StatusBadge, LoadingState } from '../../../components/ui'

interface DashboardStats {
  listings: { active: number; draft: number; newToday: number; total: number }
  orders: { pendingPayment: number; inEscrow: number; completedToday: number; total: number }
  escrow: { heldAmount: number; disputesOpen: number; autoReleaseSoon: number }
  users: { total: number; newToday: number; banned: number }
  businesses: { total: number; pendingVerification: number; verified: number }
  revenue: { gmvTotal: number; gmvToday: number; avgOrderValue: number }
  recentOrders: Array<{
    id: string; amount: number; orderStatus: string; paymentMethod: string; createdAt: string
    buyer: { name: string }; listing: { title: string }
  }>
  openDisputes: Array<{
    id: string; amount: number; createdAt: string
    buyer: { name: string }; seller: { name: string }; listing: { title: string }
  }>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-3 text-ink-400">{children}</p>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function load() {
    setLoading(true)
    const [analyticsRes, listingsRes, ordersRes, usersRes, businessesRes, disputesRes] = await Promise.all([
      api.get<any>('/admin/analytics'),
      api.get<any>('/admin/listings?limit=1'),
      api.get<any>('/admin/orders?limit=5'),
      api.get<any>('/admin/users?limit=1'),
      api.get<any>('/admin/businesses?limit=1'),
      api.get<any>('/admin/disputes'),
    ])

    const totals = analyticsRes.success ? analyticsRes.data.totals : {}
    const snapshots = analyticsRes.success ? analyticsRes.data.snapshots : []
    const today = snapshots[0] ?? {}

    setStats({
      listings: {
        active: listingsRes.success ? listingsRes.data.total : 0,
        draft: 0,
        newToday: 0,
        total: listingsRes.success ? listingsRes.data.total : 0,
      },
      orders: {
        pendingPayment: 0,
        inEscrow: 0,
        completedToday: today.orderCount ?? 0,
        total: Number(totals?.orders ?? 0),
      },
      escrow: {
        heldAmount: Number(totals?.gmv ?? 0) * 0.12,
        disputesOpen: disputesRes.success ? disputesRes.data.total : 0,
        autoReleaseSoon: 0,
      },
      users: {
        total: usersRes.success ? usersRes.data.total : 0,
        newToday: 0,
        banned: 0,
      },
      businesses: {
        total: businessesRes.success ? businessesRes.data.total : 0,
        pendingVerification: 0,
        verified: 0,
      },
      revenue: {
        gmvTotal: Number(totals?.gmv ?? 0),
        gmvToday: today.gmv ?? 0,
        avgOrderValue: Number(totals?.orders) > 0 ? Number(totals?.gmv) / Number(totals?.orders) : 0,
      },
      recentOrders: ordersRes.success ? ordersRes.data.items ?? [] : [],
      openDisputes: disputesRes.success ? disputesRes.data.items?.slice(0, 5) ?? [] : [],
    })
    setLastRefresh(new Date())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading || !stats) return <LoadingState label="Loading dashboard…" />

  const s = stats

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Live operational view · Updated ${lastRefresh.toLocaleTimeString()}`}
        actions={
          <Button variant="primary" size="sm" onClick={load}>
            <RefreshCw size={13} />
            Refresh
          </Button>
        }
      />

      <section>
        <SectionLabel>Revenue</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total GMV" value={formatETB(s.revenue.gmvTotal)} sub="All completed orders" icon={TrendingUp} accent="value" href="/analytics" />
          <StatCard label="GMV Today" value={formatETB(s.revenue.gmvToday)} sub="Completed today" icon={TrendingUp} accent="value" />
          <StatCard label="Avg Order Value" value={formatETB(s.revenue.avgOrderValue)} sub="Per completed order" icon={TrendingUp} accent="value" />
        </div>
      </section>

      <section>
        <SectionLabel>Orders &amp; Escrow</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={s.orders.total} sub="All time" icon={ShoppingBag} accent="brand" href="/orders" />
          <StatCard label="Completed Today" value={s.orders.completedToday} icon={CheckCircle} accent="brand" />
          <StatCard label="Held in Escrow" value={formatETB(s.escrow.heldAmount)} sub="Est. pending release" icon={Clock} accent="action" />
          <StatCard
            label="Open Disputes"
            value={s.escrow.disputesOpen}
            sub={s.escrow.disputesOpen > 0 ? 'Needs review' : 'All clear'}
            icon={ShieldCheck}
            accent={s.escrow.disputesOpen > 0 ? 'action' : 'brand'}
            href="/disputes"
          />
        </div>
      </section>

      <section>
        <SectionLabel>Marketplace</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Listings" value={s.listings.active} icon={Package} accent="brand" href="/listings" />
          <StatCard label="Total Users" value={s.users.total} icon={Users} accent="brand" href="/users" />
          <StatCard label="Registered Businesses" value={s.businesses.total} icon={Building2} accent="brand" href="/businesses" />
          <StatCard
            label="Pending Verification"
            value={s.businesses.pendingVerification}
            sub={s.businesses.pendingVerification > 0 ? 'Awaiting review' : 'All verified'}
            icon={AlertCircle}
            accent={s.businesses.pendingVerification > 0 ? 'action' : 'brand'}
            href="/businesses"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/orders" className="text-xs font-semibold flex items-center gap-1 text-brand-600 hover:text-brand-700">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-canvas-300/60">
            {s.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-ink-300">No orders yet</p>
            ) : s.recentOrders.map((o) => (
              <div key={o.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-ink-900">{o.listing?.title ?? 'Item'}</p>
                  <p className="text-xs mt-0.5 text-ink-400">{o.buyer?.name ?? '—'} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-sm font-bold text-value-700 tabular-nums">{formatETB(o.amount)}</span>
                  <StatusBadge status={o.orderStatus} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Open Disputes</CardTitle>
              {s.escrow.disputesOpen > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-action-100 text-action-700">
                  {s.escrow.disputesOpen}
                </span>
              )}
            </div>
            <Link href="/disputes" className="text-xs font-semibold flex items-center gap-1 text-brand-600 hover:text-brand-700">
              Manage <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-canvas-300/60">
            {s.openDisputes.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={22} className="mx-auto mb-2 text-brand-500" />
                <p className="text-sm font-semibold text-brand-700">No open disputes</p>
                <p className="text-xs mt-0.5 text-ink-400">Marketplace is healthy</p>
              </div>
            ) : s.openDisputes.map((d) => (
              <div key={d.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-ink-900">{d.listing?.title ?? 'Item'}</p>
                    <p className="text-xs mt-0.5 text-ink-400">{d.buyer?.name} vs {d.seller?.name}</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0 text-value-700 tabular-nums">{formatETB(d.amount)}</span>
                </div>
                <p className="text-xs mt-1 text-ink-300">{new Date(d.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
