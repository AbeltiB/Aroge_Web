'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

type FeeType = 'PERCENTAGE' | 'FLAT'
type FeeVisibility = 'BUYER' | 'SELLER' | 'BOTH'

interface PlatformFee {
  id: string
  name: string
  type: FeeType
  value: number
  visibleTo: FeeVisibility
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

const VISIBILITY_LABELS: Record<FeeVisibility, string> = {
  BUYER: 'Buyer only',
  SELLER: 'Seller only',
  BOTH: 'Both',
}

const VISIBILITY_COLORS: Record<FeeVisibility, string> = {
  BUYER: '#e6f0eb',
  SELLER: '#faeeda',
  BOTH: 'rgba(31,122,90,0.1)',
}

const VISIBILITY_TEXT: Record<FeeVisibility, string> = {
  BUYER: '#1f7a5a',
  SELLER: '#3d2a10',
  BOTH: '#1a3028',
}

const emptyForm = {
  name: '',
  type: 'PERCENTAGE' as FeeType,
  value: '',
  visibleTo: 'BUYER' as FeeVisibility,
  displayOrder: '0',
  isActive: true,
}

export default function FeesPage() {
  const [fees, setFees] = useState<PlatformFee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await api.get<PlatformFee[]>('/admin/fees')
    if (res.success) setFees(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(fee: PlatformFee) {
    setForm({
      name: fee.name,
      type: fee.type,
      value: String(fee.value),
      visibleTo: fee.visibleTo,
      displayOrder: String(fee.displayOrder),
      isActive: fee.isActive,
    })
    setEditingId(fee.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.value) return
    setSaving(true)
    const body = {
      name: form.name,
      type: form.type,
      value: Number(form.value),
      visibleTo: form.visibleTo,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    }
    const res = editingId
      ? await api.patch(`/admin/fees/${editingId}`, body)
      : await api.post('/admin/fees', body)
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setEditingId(null)
      load()
    }
  }

  async function toggleActive(fee: PlatformFee) {
    setTogglingId(fee.id)
    await api.patch(`/admin/fees/${fee.id}`, { isActive: !fee.isActive })
    setTogglingId(null)
    load()
  }

  async function deleteFee(id: string) {
    if (!confirm('Delete this fee? This cannot be undone.')) return
    setDeletingId(id)
    await api.delete(`/admin/fees/${id}`)
    setDeletingId(null)
    load()
  }

  const buyerFees = fees.filter((f) => f.isActive && (f.visibleTo === 'BUYER' || f.visibleTo === 'BOTH'))
  const sellerFees = fees.filter((f) => f.isActive && (f.visibleTo === 'SELLER' || f.visibleTo === 'BOTH'))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a3028' }}>Fees &amp; Charges</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(31,122,90,0.55)' }}>
            Manage platform fees. Toggle to show or hide from buyers and sellers.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1f7a5a' }}
        >
          + Add Fee
        </button>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border" style={{ background: '#e6f0eb', borderColor: 'rgba(31,122,90,0.15)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#1f7a5a' }}>
            What Buyers See
          </p>
          {buyerFees.length === 0
            ? <p className="text-sm" style={{ color: 'rgba(31,122,90,0.5)' }}>No active buyer fees</p>
            : buyerFees.map((f) => (
              <div key={f.id} className="flex justify-between text-sm py-1">
                <span style={{ color: '#1a3028' }}>{f.name}</span>
                <span className="font-semibold" style={{ color: '#1f7a5a' }}>
                  {f.type === 'PERCENTAGE' ? `${f.value}%` : `ETB ${f.value}`}
                </span>
              </div>
            ))
          }
        </div>
        <div className="rounded-xl p-4 border" style={{ background: '#faeeda', borderColor: 'rgba(200,155,60,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#3d2a10' }}>
            What Sellers See
          </p>
          {sellerFees.length === 0
            ? <p className="text-sm" style={{ color: 'rgba(61,42,16,0.4)' }}>No active seller fees</p>
            : sellerFees.map((f) => (
              <div key={f.id} className="flex justify-between text-sm py-1">
                <span style={{ color: '#1a3028' }}>{f.name}</span>
                <span className="font-semibold" style={{ color: '#c89b3c' }}>
                  {f.type === 'PERCENTAGE' ? `${f.value}%` : `ETB ${f.value}`}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Fees table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'rgba(31,122,90,0.1)' }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-2xl mb-2">💰</p>
            <p className="font-semibold" style={{ color: '#1a3028' }}>No fees configured</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(31,122,90,0.5)' }}>
              Add your first fee to start collecting service charges.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(31,122,90,0.08)', background: 'rgba(31,122,90,0.03)' }}>
                {['Fee Name', 'Type', 'Value', 'Visible To', 'Order', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide"
                    style={{ color: 'rgba(31,122,90,0.5)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, i) => (
                <tr
                  key={fee.id}
                  style={{
                    borderTop: i > 0 ? '1px solid rgba(31,122,90,0.06)' : 'none',
                    opacity: fee.isActive ? 1 : 0.5,
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#1a3028' }}>{fee.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: fee.type === 'PERCENTAGE' ? '#e6f0eb' : '#faeeda', color: fee.type === 'PERCENTAGE' ? '#1f7a5a' : '#3d2a10' }}>
                      {fee.type === 'PERCENTAGE' ? '%' : 'Flat'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#c89b3c' }}>
                    {fee.type === 'PERCENTAGE' ? `${fee.value}%` : `ETB ${fee.value.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ background: VISIBILITY_COLORS[fee.visibleTo], color: VISIBILITY_TEXT[fee.visibleTo] }}>
                      {VISIBILITY_LABELS[fee.visibleTo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: '#1a3028' }}>{fee.displayOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(fee)}
                      disabled={togglingId === fee.id}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                      style={{ background: fee.isActive ? '#1f7a5a' : 'rgba(31,122,90,0.2)' }}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                        style={{ transform: fee.isActive ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(fee)}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ background: 'rgba(31,122,90,0.1)', color: '#1f7a5a' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFee(fee.id)}
                        disabled={deletingId === fee.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ background: 'rgba(184,92,42,0.1)', color: '#B85C2A' }}
                      >
                        {deletingId === fee.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'rgba(31,122,90,0.06)', color: 'rgba(31,122,90,0.4)' }}>
          When a fee is toggled OFF, buyers and sellers never see it and it is not applied at checkout.
        </div>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl" style={{ background: 'white' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#1a3028' }}>
                {editingId ? 'Edit Fee' : 'New Fee'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-xl leading-none" style={{ color: 'rgba(31,122,90,0.4)' }}>✕</button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>
                Fee Name
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                placeholder="e.g. Service Fee, VAT, Platform Fee"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as FeeType })}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (ETB)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>
                  Value {form.type === 'PERCENTAGE' ? '(%)' : '(ETB)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step={form.type === 'PERCENTAGE' ? '0.1' : '1'}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                  placeholder={form.type === 'PERCENTAGE' ? '2.5' : '50'}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>

            {/* Visible To */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(31,122,90,0.5)' }}>
                Visible To
              </label>
              <div className="flex gap-2">
                {(['BUYER', 'SELLER', 'BOTH'] as FeeVisibility[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, visibleTo: v })}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{
                      background: form.visibleTo === v ? '#1f7a5a' : 'transparent',
                      color: form.visibleTo === v ? 'white' : '#1a3028',
                      borderColor: form.visibleTo === v ? '#1f7a5a' : 'rgba(31,122,90,0.2)',
                    }}
                  >
                    {VISIBILITY_LABELS[v]}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(31,122,90,0.45)' }}>
                {form.visibleTo === 'BUYER' && 'Fee is shown to buyers at checkout and added to their total.'}
                {form.visibleTo === 'SELLER' && 'Fee is shown in seller payouts (informational only).'}
                {form.visibleTo === 'BOTH' && 'Fee is shown to both buyers at checkout and sellers in payouts.'}
              </p>
            </div>

            {/* Display order + Active */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>
                  Active
                </label>
                <button
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className="flex items-center gap-2 h-[38px] px-3 rounded-lg border text-sm font-medium"
                  style={{
                    borderColor: form.isActive ? '#1f7a5a' : 'rgba(31,122,90,0.2)',
                    background: form.isActive ? '#e6f0eb' : 'transparent',
                    color: form.isActive ? '#1f7a5a' : '#1a3028',
                  }}
                >
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: form.isActive ? '#1f7a5a' : 'rgba(31,122,90,0.2)' }} />
                  {form.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            {/* Live preview */}
            {form.name && form.value && (
              <div className="rounded-lg p-3 border" style={{ background: 'rgba(31,122,90,0.04)', borderColor: 'rgba(31,122,90,0.12)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>PREVIEW ON ETB 1,000 ITEM</p>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#1a3028' }}>
                    {form.name || 'Fee'} {form.type === 'PERCENTAGE' ? `(${form.value}%)` : '(flat)'}
                  </span>
                  <span className="font-bold" style={{ color: '#c89b3c' }}>
                    ETB {form.type === 'PERCENTAGE'
                      ? (1000 * Number(form.value) / 100).toFixed(2)
                      : Number(form.value).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name || !form.value}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ background: '#1f7a5a', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Fee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
