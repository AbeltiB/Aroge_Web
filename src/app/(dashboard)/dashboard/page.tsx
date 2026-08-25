'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { formatETB } from 'aroge-sdk'
import {
  Package, ShoppingBag, ShieldCheck, Users,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  Building2, RefreshCw, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

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

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: '#faeeda',
  PAID_ESCROWED: '#e6f0eb',
  IN_TRANSIT: '#e6f0eb',
  COMPLETED: '#e6f0eb',
  DISPUTED: 'rgba(184,92,42,0.12)',
  REFUNDED: '#f5f5f5',
}
const STATUS_TEXT: Record<string, string> = {
  PENDING_PAYMENT: '#3d2a10',
  PAID_ESCROWED: '#174d39',
  IN_TRANSIT: '#174d39',
  COMPLETED: '#174d39',
  DISPUTED: '#B85C2A',
  REFUNDED: '#888',
}

function StatCard({
  label, value, sub, icon: Icon, accent, href,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent: string; href?: string
}) {
  const content = (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-transparent hover:border-opacity-30 transition-all group" style={{ borderColor: accent }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(31,122,90,0.45)' }}>{label}</p>
          <p className="text-3xl font-black mt-1 tracking-tight" style={{ color: '#1a3028' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#888' }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all" style={{ color: accent }}>
          View all <ArrowRight size={11} />
        </div>
      )}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3" style={{ color: 'rgba(31,122,90,0.45)' }}>
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Loading dashboard…</span>
        </div>
      </div>
    )
  }

  const s = stats!

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#1a3028' }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(31,122,90,0.5)' }}>
            Live operational view · Updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
          style={{ background: '#1f7a5a', color: '#f3efe7' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Revenue row */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(31,122,90,0.4)' }}>Revenue</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total GMV" value={formatETB(s.revenue.gmvTotal)} sub="All completed orders" icon={TrendingUp} accent="#c89b3c" href="/analytics" />
          <StatCard label="GMV Today" value={formatETB(s.revenue.gmvToday)} sub="Completed today" icon={TrendingUp} accent="#c89b3c" />
          <StatCard label="Avg Order Value" value={formatETB(s.revenue.avgOrderValue)} sub="Per completed order" icon={TrendingUp} accent="#c89b3c" />
        </div>
      </section>

      {/* Orders & Escrow */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(31,122,90,0.4)' }}>Orders & Escrow</p>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={s.orders.total} sub="All time" icon={ShoppingBag} accent="#1f7a5a" href="/orders" />
          <StatCard label="Completed Today" value={s.orders.completedToday} icon={CheckCircle} accent="#1f7a5a" />
          <StatCard label="Held in Escrow" value={formatETB(s.escrow.heldAmount)} sub="Est. pending release" icon={Clock} accent="#B85C2A" />
          <StatCard label="Open Disputes" value={s.escrow.disputesOpen} sub={s.escrow.disputesOpen > 0 ? 'Needs review' : 'All clear'} icon={ShieldCheck} accent={s.escrow.disputesOpen > 0 ? '#B85C2A' : '#1f7a5a'} href="/disputes" />
        </div>
      </section>

      {/* Marketplace */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(31,122,90,0.4)' }}>Marketplace</p>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Active Listings" value={s.listings.active} icon={Package} accent="#1f7a5a" href="/listings" />
          <StatCard label="Total Users" value={s.users.total} icon={Users} accent="#174d39" href="/users" />
          <StatCard label="Registered Businesses" value={s.businesses.total} icon={Building2} accent="#174d39" href="/businesses" />
          <StatCard label="Pending Verification" value={s.businesses.pendingVerification} sub={s.businesses.pendingVerification > 0 ? 'Awaiting review' : 'All verified'} icon={AlertCircle} accent={s.businesses.pendingVerification > 0 ? '#B85C2A' : '#1f7a5a'} href="/businesses" />
        </div>
      </section>

      {/* Two column: recent orders + open disputes */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
            <h3 className="font-bold text-sm" style={{ color: '#1a3028' }}>Recent Orders</h3>
            <Link href="/orders" className="text-xs font-medium flex items-center gap-1" style={{ color: '#1f7a5a' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
            {s.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center" style={{ color: 'rgba(31,122,90,0.35)' }}>No orders yet</p>
            ) : s.recentOrders.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#1a3028' }}>{o.listing?.title ?? 'Item'}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>{o.buyer?.name ?? '—'} · {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: '#c89b3c' }}>{formatETB(o.amount)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: STATUS_COLOR[o.orderStatus] ?? '#f5f5f5', color: STATUS_TEXT[o.orderStatus] ?? '#888' }}>
                    {o.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Disputes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm" style={{ color: '#1a3028' }}>Open Disputes</h3>
              {s.escrow.disputesOpen > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(184,92,42,0.12)', color: '#B85C2A' }}>
                  {s.escrow.disputesOpen}
                </span>
              )}
            </div>
            <Link href="/disputes" className="text-xs font-medium flex items-center gap-1" style={{ color: '#1f7a5a' }}>
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
            {s.openDisputes.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={24} className="mx-auto mb-2" style={{ color: '#1f7a5a' }} />
                <p className="text-sm font-medium" style={{ color: '#1f7a5a' }}>No open disputes</p>
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>Marketplace is healthy</p>
              </div>
            ) : s.openDisputes.map((d) => (
              <div key={d.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1a3028' }}>{d.listing?.title ?? 'Item'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {d.buyer?.name} vs {d.seller?.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: '#c89b3c' }}>{formatETB(d.amount)}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(31,122,90,0.45)' }}>
                  {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
