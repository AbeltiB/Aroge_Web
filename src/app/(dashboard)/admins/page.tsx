'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth.store'

interface AdminUser {
  id: string
  telegramId: string
  name: string
  role: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT'
  createdAt: string
}

const ROLES: AdminUser['role'][] = ['SUPPORT', 'MODERATOR', 'SUPER_ADMIN']

const emptyForm = { telegramId: '', name: '', role: 'MODERATOR' as AdminUser['role'] }

export default function AdminsPage() {
  const currentAdmin = useAuthStore((s) => s.admin)
  const [items, setItems] = useState<AdminUser[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setForbidden(false)
    api.get<AdminUser[]>('/admin/admins').then((res) => {
      if (res.success) setItems(res.data)
      else setForbidden(true)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.telegramId || !form.name) return
    setSaving(true)
    const res = await api.post('/admin/admins', form)
    setSaving(false)
    if (!res.success) { alert((res as any).message ?? 'Could not create admin'); return }
    setShowForm(false)
    setForm(emptyForm)
    load()
  }

  async function changeRole(id: string, role: AdminUser['role']) {
    setActingId(id)
    const res = await api.patch(`/admin/admins/${id}/role`, { role })
    setActingId(null)
    if (!res.success) alert((res as any).message ?? 'Could not change role')
    load()
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remove admin access for ${name}? This cannot be undone from here.`)) return
    setActingId(id)
    const res = await api.delete(`/admin/admins/${id}`)
    setActingId(null)
    if (!res.success) alert((res as any).message ?? 'Could not remove admin')
    load()
  }

  if (!loading && forbidden) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-sm" style={{ color: '#888' }}>
          Admin management is restricted to SUPER_ADMIN accounts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Admins</h2>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true) }}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#1f7a5a' }}
        >
          + Add Admin
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f3efe7', color: 'rgba(31,122,90,0.6)' }}>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Telegram ID</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Since</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items?.map((a) => {
                const isSelf = a.id === currentAdmin?.sub
                return (
                  <tr key={a.id} className="border-t" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1a3028' }}>
                      {a.name} {isSelf && <span className="text-xs font-normal" style={{ color: '#888' }}>(you)</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#444' }}>{a.telegramId}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.role}
                        disabled={actingId === a.id}
                        onChange={(e) => changeRole(a.id, e.target.value as AdminUser['role'])}
                        className="text-xs border rounded px-2 py-1 bg-white"
                        style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#888' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(a.id, a.name)}
                        disabled={isSelf || actingId === a.id}
                        className="text-xs px-2 py-1 rounded disabled:opacity-40"
                        style={{ background: 'rgba(184,92,42,0.1)', color: '#B85C2A' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl" style={{ background: 'white' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#1a3028' }}>Add Admin</h2>
              <button onClick={() => setShowForm(false)} className="text-xl leading-none" style={{ color: 'rgba(31,122,90,0.4)' }}>✕</button>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Telegram ID</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                placeholder="Get this from @userinfobot on Telegram"
                value={form.telegramId}
                onChange={(e) => setForm({ ...form, telegramId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgba(31,122,90,0.5)' }}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser['role'] })}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
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
                onClick={create}
                disabled={saving || !form.telegramId || !form.name}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#1f7a5a', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
