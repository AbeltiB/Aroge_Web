'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

interface DeliverySettings {
  isEnabled: boolean
  fee: number
}

interface DeliveryRequest {
  id: string
  fee: number
  status: string
  createdAt: string
  order: {
    id: string
    listing: { id: string; title: string }
    buyer: { id: string; name: string }
    seller: { id: string; name: string }
  }
}

interface PendingResponse {
  items: DeliveryRequest[]
  total: number
  page: number
}

export default function DeliveryPage() {
  const [settings, setSettings] = useState<DeliverySettings>({ isEnabled: false, fee: 0 })
  const [settingsForm, setSettingsForm] = useState({ isEnabled: false, fee: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [pending, setPending] = useState<DeliveryRequest[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [loadingPending, setLoadingPending] = useState(true)

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)

  async function loadSettings() {
    const res = await api.get<DeliverySettings>('/delivery/settings')
    if (res.success) {
      setSettings(res.data)
      setSettingsForm({ isEnabled: res.data.isEnabled, fee: String(res.data.fee) })
    }
  }

  async function loadPending() {
    setLoadingPending(true)
    const res = await api.get<PendingResponse>('/delivery/admin/pending')
    if (res.success) {
      setPending(res.data.items)
      setPendingTotal(res.data.total)
    }
    setLoadingPending(false)
  }

  useEffect(() => {
    loadSettings()
    loadPending()
  }, [])

  async function saveSettings() {
    setSavingSettings(true)
    const res = await api.patch('/delivery/admin/settings', {
      isEnabled: settingsForm.isEnabled,
      fee: Number(settingsForm.fee) || 0,
    })
    setSavingSettings(false)
    if (res.success) {
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
      loadSettings()
    }
  }

  async function approve(deliveryId: string) {
    setApprovingId(deliveryId)
    await api.post(`/delivery/admin/${deliveryId}/approve`, {})
    setApprovingId(null)
    loadPending()
  }

  async function reject(deliveryId: string) {
    if (!rejectReason.trim()) return
    setRejectingId(deliveryId)
    await api.post(`/delivery/admin/${deliveryId}/reject`, { reason: rejectReason })
    setRejectingId(null)
    setRejectReason('')
    loadPending()
  }

  const [expandedReject, setExpandedReject] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a3028' }}>Delivery</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(31,122,90,0.55)' }}>
          Configure delivery service and review buyer requests.
        </p>
      </div>

      {/* Settings card */}
      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'white', borderColor: 'rgba(31,122,90,0.1)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold" style={{ color: '#1a3028' }}>Delivery Service Settings</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(31,122,90,0.5)' }}>
              When disabled, buyers will not see the delivery option at checkout.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: settingsForm.isEnabled ? '#1f7a5a' : 'rgba(31,122,90,0.4)' }}>
              {settingsForm.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => setSettingsForm((f) => ({ ...f, isEnabled: !f.isEnabled }))}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              style={{ background: settingsForm.isEnabled ? '#1f7a5a' : 'rgba(31,122,90,0.2)' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
                style={{ transform: settingsForm.isEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'rgba(31,122,90,0.5)' }}>
            Delivery Fee (ETB)
          </label>
          <div className="flex gap-3 items-start">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'rgba(31,122,90,0.4)' }}>ETB</span>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full border rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                placeholder="0"
                value={settingsForm.fee}
                onChange={(e) => setSettingsForm((f) => ({ ...f, fee: e.target.value }))}
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: '#1f7a5a', opacity: savingSettings ? 0.6 : 1 }}
            >
              {savingSettings ? 'Saving…' : settingsSaved ? '✓ Saved' : 'Save Settings'}
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(31,122,90,0.4)' }}>
            This fee will be shown to buyers at checkout and snapshotted into each order at the time of purchase.
          </p>
        </div>

        {/* Current effective settings */}
        <div className="flex gap-4 pt-2 border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(31,122,90,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(31,122,90,0.5)' }}>Status</p>
            <p className="font-bold text-sm mt-0.5" style={{ color: settings.isEnabled ? '#1f7a5a' : '#B85C2A' }}>
              {settings.isEnabled ? 'Active' : 'Off'}
            </p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(31,122,90,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(31,122,90,0.5)' }}>Current Fee</p>
            <p className="font-bold text-sm mt-0.5" style={{ color: '#c89b3c' }}>
              ETB {settings.fee.toLocaleString()}
            </p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl" style={{ background: 'rgba(31,122,90,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(31,122,90,0.5)' }}>Pending Requests</p>
            <p className="font-bold text-sm mt-0.5" style={{ color: pendingTotal > 0 ? '#B85C2A' : '#1a3028' }}>
              {pendingTotal}
            </p>
          </div>
        </div>
      </div>

      {/* Pending delivery requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: '#1a3028' }}>
            Pending Approval
            {pendingTotal > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#B85C2A' }}>
                {pendingTotal}
              </span>
            )}
          </h2>
          <button
            onClick={loadPending}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-opacity hover:opacity-70"
            style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1f7a5a' }}
          >
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'rgba(31,122,90,0.1)' }}>
          {loadingPending ? (
            <div className="p-12 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
          ) : pending.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-2xl mb-2">🚚</p>
              <p className="font-semibold" style={{ color: '#1a3028' }}>No pending requests</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(31,122,90,0.5)' }}>
                Delivery requests from buyers will appear here for approval.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(31,122,90,0.06)' }}>
              {pending.map((req) => (
                <div key={req.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm" style={{ color: '#1a3028' }}>
                        {req.order.listing.title}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(31,122,90,0.55)' }}>
                        Buyer: <span className="font-medium" style={{ color: '#1a3028' }}>{req.order.buyer.name}</span>
                        {' · '}
                        Seller: <span className="font-medium" style={{ color: '#1a3028' }}>{req.order.seller.name}</span>
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(31,122,90,0.4)' }}>
                        Requested {new Date(req.createdAt).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}Fee: <span className="font-semibold" style={{ color: '#c89b3c' }}>ETB {req.fee.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approve(req.id)}
                        disabled={approvingId === req.id}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
                        style={{ background: '#1f7a5a', opacity: approvingId === req.id ? 0.6 : 1 }}
                      >
                        {approvingId === req.id ? 'Approving…' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => setExpandedReject(expandedReject === req.id ? null : req.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ background: 'rgba(184,92,42,0.1)', color: '#B85C2A' }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  {/* Inline reject reason */}
                  {expandedReject === req.id && (
                    <div className="flex gap-2 pt-1">
                      <input
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: 'rgba(184,92,42,0.3)', color: '#1a3028' }}
                        placeholder="Reason for rejection (required)…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && rejectReason.trim()) reject(req.id)
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => reject(req.id)}
                        disabled={!rejectReason.trim() || rejectingId === req.id}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ background: '#B85C2A', opacity: !rejectReason.trim() || rejectingId === req.id ? 0.5 : 1 }}
                      >
                        {rejectingId === req.id ? '…' : 'Send'}
                      </button>
                      <button
                        onClick={() => { setExpandedReject(null); setRejectReason('') }}
                        className="px-3 py-2 rounded-lg text-xs border"
                        style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
