'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { PageHeader, Card, CardTitle, Button, Toggle, Input, LoadingState, EmptyState } from '../../../components/ui'
import { Truck, Check, X } from 'lucide-react'

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
  const [expandedReject, setExpandedReject] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery" subtitle="Configure delivery service and review buyer requests." />

      <Card padded className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Delivery Service Settings</CardTitle>
            <p className="text-xs mt-0.5 text-ink-400">When disabled, buyers will not see the delivery option at checkout.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${settingsForm.isEnabled ? 'text-brand-600' : 'text-ink-300'}`}>
              {settingsForm.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <Toggle checked={settingsForm.isEnabled} onChange={() => setSettingsForm((f) => ({ ...f, isEnabled: !f.isEnabled }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink-400">Delivery Fee (ETB)</label>
          <div className="flex gap-3 items-start flex-wrap">
            <div className="relative flex-1 max-w-xs min-w-[160px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-300">ETB</span>
              <Input type="number" min="0" step="1" className="pl-12" placeholder="0" value={settingsForm.fee} onChange={(e) => setSettingsForm((f) => ({ ...f, fee: e.target.value }))} />
            </div>
            <Button variant="primary" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving…' : settingsSaved ? '✓ Saved' : 'Save Settings'}
            </Button>
          </div>
          <p className="text-xs mt-1.5 text-ink-400">This fee will be shown to buyers at checkout and snapshotted into each order at the time of purchase.</p>
        </div>

        <div className="flex gap-4 pt-2 border-t border-canvas-300/60">
          <div className="text-center px-4 py-2 rounded-xl bg-canvas-100">
            <p className="text-xs text-ink-400">Status</p>
            <p className={`font-bold text-sm mt-0.5 ${settings.isEnabled ? 'text-brand-600' : 'text-action-600'}`}>{settings.isEnabled ? 'Active' : 'Off'}</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-canvas-100">
            <p className="text-xs text-ink-400">Current Fee</p>
            <p className="font-bold text-sm mt-0.5 text-value-700">ETB {settings.fee.toLocaleString()}</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-canvas-100">
            <p className="text-xs text-ink-400">Pending Requests</p>
            <p className={`font-bold text-sm mt-0.5 ${pendingTotal > 0 ? 'text-action-600' : 'text-ink-900'}`}>{pendingTotal}</p>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
            Pending Approval
            {pendingTotal > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-action-500">{pendingTotal}</span>}
          </h2>
          <Button variant="secondary" size="sm" onClick={loadPending}>Refresh</Button>
        </div>

        {loadingPending ? <LoadingState /> : pending.length === 0 ? (
          <Card><EmptyState icon={Truck} title="No pending requests" subtitle="Delivery requests from buyers will appear here for approval." /></Card>
        ) : (
          <Card className="divide-y divide-canvas-300/60">
            {pending.map((req) => (
              <div key={req.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-ink-900">{req.order.listing.title}</p>
                    <p className="text-xs text-ink-500">
                      Buyer: <span className="font-medium text-ink-900">{req.order.buyer.name}</span>
                      {' · '}Seller: <span className="font-medium text-ink-900">{req.order.seller.name}</span>
                    </p>
                    <p className="text-xs text-ink-400">
                      Requested {new Date(req.createdAt).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' · '}Fee: <span className="font-semibold text-value-700">ETB {req.fee.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="primary" onClick={() => approve(req.id)} disabled={approvingId === req.id}>
                      <Check size={13} /> {approvingId === req.id ? 'Approving…' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setExpandedReject(expandedReject === req.id ? null : req.id)}>
                      <X size={13} /> Reject
                    </Button>
                  </div>
                </div>

                {expandedReject === req.id && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <Input
                      className="flex-1 min-w-[200px] border-action-300"
                      placeholder="Reason for rejection (required)…"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && rejectReason.trim()) reject(req.id) }}
                      autoFocus
                    />
                    <Button variant="danger" onClick={() => reject(req.id)} disabled={!rejectReason.trim() || rejectingId === req.id}>
                      {rejectingId === req.id ? '…' : 'Send'}
                    </Button>
                    <Button variant="secondary" onClick={() => { setExpandedReject(null); setRejectReason('') }}>Cancel</Button>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
