'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth.store'
import { PageHeader, Table, THead, Th, Tr, Td, Button, Select, Modal, Field, Input, LoadingState, Card } from '../../../components/ui'
import { Plus, UserCog } from 'lucide-react'

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
      <Card padded className="text-center py-10">
        <UserCog size={22} className="mx-auto mb-2 text-ink-300" />
        <p className="text-sm text-ink-400">Admin management is restricted to SUPER_ADMIN accounts.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admins"
        actions={
          <Button variant="primary" size="sm" onClick={() => { setForm(emptyForm); setShowForm(true) }}>
            <Plus size={14} /> Add Admin
          </Button>
        }
      />

      {loading ? <LoadingState /> : (
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Telegram ID</Th>
              <Th>Role</Th>
              <Th>Since</Th>
              <Th />
            </tr>
          </THead>
          <tbody>
            {items?.map((a) => {
              const isSelf = a.id === currentAdmin?.sub
              return (
                <Tr key={a.id}>
                  <Td className="font-semibold text-ink-900">
                    {a.name} {isSelf && <span className="text-xs font-normal text-ink-400">(you)</span>}
                  </Td>
                  <Td className="font-mono text-xs">{a.telegramId}</Td>
                  <Td>
                    <Select
                      value={a.role}
                      disabled={actingId === a.id}
                      onChange={(e) => changeRole(a.id, e.target.value as AdminUser['role'])}
                      className="text-xs py-1"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  </Td>
                  <Td className="text-xs text-ink-400">{new Date(a.createdAt).toLocaleDateString()}</Td>
                  <Td className="text-right">
                    <Button
                      size="sm" variant="danger"
                      onClick={() => remove(a.id, a.name)}
                      disabled={isSelf || actingId === a.id}
                    >
                      Remove
                    </Button>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      )}

      {showForm && (
        <Modal title="Add Admin" onClose={() => setShowForm(false)}>
          <Field label="Telegram ID">
            <Input
              placeholder="Get this from @userinfobot on Telegram"
              value={form.telegramId}
              onChange={(e) => setForm({ ...form, telegramId: e.target.value })}
            />
          </Field>
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser['role'] })}
              className="w-full"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={create} disabled={saving || !form.telegramId || !form.name} className="flex-1">
              {saving ? 'Saving…' : 'Create'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
