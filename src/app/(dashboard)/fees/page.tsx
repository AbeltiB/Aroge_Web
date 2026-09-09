'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { PageHeader, Card, CardTitle, Table, THead, Th, Tr, Td, Badge, Button, Toggle, Modal, Field, Input, Select, LoadingState, EmptyState } from '../../../components/ui'
import { Plus, Coins } from 'lucide-react'

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
      <PageHeader
        title="Fees & Charges"
        subtitle="Manage platform fees. Toggle to show or hide from buyers and sellers."
        actions={<Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} /> Add Fee</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padded className="bg-brand-50 border-brand-200">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-brand-700">What Buyers See</p>
          {buyerFees.length === 0
            ? <p className="text-sm text-brand-600/60">No active buyer fees</p>
            : buyerFees.map((f) => (
              <div key={f.id} className="flex justify-between text-sm py-1">
                <span className="text-ink-900">{f.name}</span>
                <span className="font-semibold text-brand-700">{f.type === 'PERCENTAGE' ? `${f.value}%` : `ETB ${f.value}`}</span>
              </div>
            ))}
        </Card>
        <Card padded className="bg-value-50 border-value-200">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-value-800">What Sellers See</p>
          {sellerFees.length === 0
            ? <p className="text-sm text-value-700/50">No active seller fees</p>
            : sellerFees.map((f) => (
              <div key={f.id} className="flex justify-between text-sm py-1">
                <span className="text-ink-900">{f.name}</span>
                <span className="font-semibold text-value-700">{f.type === 'PERCENTAGE' ? `${f.value}%` : `ETB ${f.value}`}</span>
              </div>
            ))}
        </Card>
      </div>

      {loading ? <LoadingState /> : fees.length === 0 ? (
        <Card><EmptyState icon={Coins} title="No fees configured" subtitle="Add your first fee to start collecting service charges." /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Fee Name</Th>
              <Th>Type</Th>
              <Th>Value</Th>
              <Th>Visible To</Th>
              <Th>Order</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </THead>
          <tbody>
            {fees.map((fee) => (
              <Tr key={fee.id} className={fee.isActive ? '' : 'opacity-50'}>
                <Td className="font-semibold text-ink-900">{fee.name}</Td>
                <Td><Badge tone={fee.type === 'PERCENTAGE' ? 'brand' : 'value'}>{fee.type === 'PERCENTAGE' ? '%' : 'Flat'}</Badge></Td>
                <Td className="font-semibold text-value-700">{fee.type === 'PERCENTAGE' ? `${fee.value}%` : `ETB ${fee.value.toLocaleString()}`}</Td>
                <Td><Badge>{VISIBILITY_LABELS[fee.visibleTo]}</Badge></Td>
                <Td className="text-center">{fee.displayOrder}</Td>
                <Td><Toggle checked={fee.isActive} onChange={() => toggleActive(fee)} disabled={togglingId === fee.id} /></Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(fee)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteFee(fee.id)} disabled={deletingId === fee.id}>
                      {deletingId === fee.id ? '…' : 'Delete'}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="text-xs text-ink-400 -mt-3">When a fee is toggled OFF, buyers and sellers never see it and it is not applied at checkout.</p>

      {showForm && (
        <Modal title={editingId ? 'Edit Fee' : 'New Fee'} onClose={() => setShowForm(false)}>
          <Field label="Fee Name">
            <Input placeholder="e.g. Service Fee, VAT, Platform Fee" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select className="w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FeeType })}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (ETB)</option>
              </Select>
            </Field>
            <Field label={`Value ${form.type === 'PERCENTAGE' ? '(%)' : '(ETB)'}`}>
              <Input
                type="number" min="0" step={form.type === 'PERCENTAGE' ? '0.1' : '1'}
                placeholder={form.type === 'PERCENTAGE' ? '2.5' : '50'}
                value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Visible To">
            <div className="flex gap-2">
              {(['BUYER', 'SELLER', 'BOTH'] as FeeVisibility[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, visibleTo: v })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.visibleTo === v ? 'bg-brand-500 text-white border-brand-500' : 'text-ink-900 border-canvas-400'
                  }`}
                >
                  {VISIBILITY_LABELS[v]}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1.5 text-ink-400">
              {form.visibleTo === 'BUYER' && 'Fee is shown to buyers at checkout and added to their total.'}
              {form.visibleTo === 'SELLER' && 'Fee is shown in seller payouts (informational only).'}
              {form.visibleTo === 'BOTH' && 'Fee is shown to both buyers at checkout and sellers in payouts.'}
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Display Order">
              <Input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
            </Field>
            <Field label="Active">
              <button
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`flex items-center gap-2 h-[38px] px-3 rounded-lg border text-sm font-medium w-full ${
                  form.isActive ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-canvas-400 text-ink-900'
                }`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${form.isActive ? 'bg-brand-500' : 'bg-canvas-400'}`} />
                {form.isActive ? 'Active' : 'Inactive'}
              </button>
            </Field>
          </div>

          {form.name && form.value && (
            <div className="rounded-lg p-3 border border-brand-200 bg-brand-50/60">
              <p className="text-xs font-semibold mb-1 text-brand-700">PREVIEW ON ETB 1,000 ITEM</p>
              <div className="flex justify-between text-sm">
                <span className="text-ink-900">{form.name || 'Fee'} {form.type === 'PERCENTAGE' ? `(${form.value}%)` : '(flat)'}</span>
                <span className="font-bold text-value-700">
                  ETB {form.type === 'PERCENTAGE' ? (1000 * Number(form.value) / 100).toFixed(2) : Number(form.value).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving || !form.name || !form.value} className="flex-1">
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Fee'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
