'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { VERIFY_ET_BANKS, VERIFY_ET_BANK_LABELS, type VerifyEtBank } from '@arogenpm/sdk'
import { PageHeader, Table, THead, Th, Tr, Td, Button, Toggle, Modal, Field, Input, Select, LoadingState, EmptyState, Card } from '../../../components/ui'
import { Plus, Landmark } from 'lucide-react'

interface BankAccount {
  id: string
  bankName: string
  bankCode: VerifyEtBank
  accountName: string
  accountNumber: string
  isActive: boolean
  createdAt: string
}

const emptyForm = { bankName: '', bankCode: '' as VerifyEtBank | '', accountName: '', accountNumber: '' }

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.get<BankAccount[]>('/admin/bank-accounts').then((res) => {
      if (res.success) setAccounts(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.bankName || !form.bankCode || !form.accountName || !form.accountNumber) return
    setSaving(true)
    const res = await api.post('/admin/bank-accounts', form)
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setForm(emptyForm)
      load()
    }
  }

  async function toggleActive(acct: BankAccount) {
    setTogglingId(acct.id)
    await api.patch(`/admin/bank-accounts/${acct.id}`, { isActive: !acct.isActive })
    setTogglingId(null)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this bank account? Buyers will no longer see it at checkout.')) return
    setDeletingId(id)
    await api.delete(`/admin/bank-accounts/${id}`)
    setDeletingId(null)
    load()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bank Accounts"
        subtitle="Accounts shown to buyers who choose Bank Transfer at checkout."
        actions={
          <Button variant="primary" size="sm" onClick={() => { setForm(emptyForm); setShowForm(true) }}>
            <Plus size={14} /> Add Account
          </Button>
        }
      />

      {loading ? <LoadingState /> : accounts.length === 0 ? (
        <Card><EmptyState icon={Landmark} title="No bank accounts configured yet" /></Card>
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Bank</Th>
              <Th>verify.et code</Th>
              <Th>Account Name</Th>
              <Th>Account Number</Th>
              <Th>Active</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {accounts.map((a) => (
              <Tr key={a.id}>
                <Td className="font-semibold text-ink-900">{a.bankName}</Td>
                <Td className="font-mono text-xs">{a.bankCode}</Td>
                <Td>{a.accountName}</Td>
                <Td className="font-mono text-xs">{a.accountNumber}</Td>
                <Td><Toggle checked={a.isActive} onChange={() => toggleActive(a)} disabled={togglingId === a.id} /></Td>
                <Td className="text-right">
                  <Button size="sm" variant="danger" onClick={() => remove(a.id)} disabled={deletingId === a.id}>
                    {deletingId === a.id ? '…' : 'Delete'}
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {showForm && (
        <Modal title="New Bank Account" onClose={() => setShowForm(false)}>
          <Field label="verify.et Bank">
            <Select
              className="w-full"
              value={form.bankCode}
              onChange={(e) => {
                const bankCode = e.target.value as VerifyEtBank
                setForm({ ...form, bankCode, bankName: form.bankName || VERIFY_ET_BANK_LABELS[bankCode] || '' })
              }}
            >
              <option value="">Select a bank…</option>
              {VERIFY_ET_BANKS.map((code) => (
                <option key={code} value={code}>{VERIFY_ET_BANK_LABELS[code]}</option>
              ))}
            </Select>
            <p className="text-xs mt-1 text-ink-400">Drives automatic transfer-reference verification via verify.et.</p>
          </Field>
          <Field label="Display Name">
            <Input placeholder="e.g. Commercial Bank of Ethiopia" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
          </Field>
          <Field label="Account Name">
            <Input placeholder="Aroge PLC" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
          </Field>
          <Field label="Account Number">
            <Input placeholder="1000123456789" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button
              variant="primary" className="flex-1"
              onClick={save}
              disabled={saving || !form.bankName || !form.bankCode || !form.accountName || !form.accountNumber}
            >
              {saving ? 'Saving…' : 'Create Account'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
