'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { VERIFY_ET_BANKS, VERIFY_ET_BANK_LABELS, type VerifyEtBank } from '@arogenpm/sdk'

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
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a3028' }}>Bank Accounts</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(31,122,90,0.55)' }}>
            Accounts shown to buyers who choose Bank Transfer at checkout.
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true) }}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#1f7a5a' }}
        >
          + Add Account
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No bank accounts configured yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Bank</th>
                <th className="text-left px-4 py-3">verify.et code</th>
                <th className="text-left px-4 py-3">Account Name</th>
                <th className="text-left px-4 py-3">Account Number</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#1a3028' }}>{a.bankName}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#444' }}>{a.bankCode}</td>
                  <td className="px-4 py-3" style={{ color: '#444' }}>{a.accountName}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#444' }}>{a.accountNumber}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(a)}
                      disabled={togglingId === a.id}
                      className="relative inline-flex h-5 w-9 items-center rounded-full"
                      style={{ background: a.isActive ? '#1f7a5a' : 'rgba(31,122,90,0.2)' }}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                        style={{ transform: a.isActive ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(a.id)}
                      disabled={deletingId === a.id}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: 'rgba(184,92,42,0.1)', color: '#B85C2A' }}
                    >
                      {deletingId === a.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl" style={{ background: 'white' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#1a3028' }}>New Bank Account</h2>
              <button onClick={() => setShowForm(false)} className="text-xl leading-none" style={{ color: 'rgba(31,122,90,0.4)' }}>✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>verify.et Bank</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                value={form.bankCode}
                onChange={(e) => {
                  const bankCode = e.target.value as VerifyEtBank
                  setForm({
                    ...form,
                    bankCode,
                    bankName: form.bankName || VERIFY_ET_BANK_LABELS[bankCode] || '',
                  })
                }}
              >
                <option value="">Select a bank…</option>
                {VERIFY_ET_BANKS.map((code) => (
                  <option key={code} value={code}>{VERIFY_ET_BANK_LABELS[code]}</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'rgba(31,122,90,0.45)' }}>
                Drives automatic transfer-reference verification via verify.et.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Display Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                placeholder="e.g. Commercial Bank of Ethiopia"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Account Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                placeholder="Aroge PLC"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Account Number</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                placeholder="1000123456789"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
            </div>
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
                disabled={saving || !form.bankName || !form.bankCode || !form.accountName || !form.accountNumber}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1f7a5a', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
