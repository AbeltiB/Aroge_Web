'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Send, Users, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { api } from '../../../lib/api'
import type { AdminBroadcast } from '@arogenpm/sdk'
import { PageHeader, Card, CardHeader, CardTitle, Table, THead, Th, Tr, Td, Button, Input, Textarea, Badge, LoadingState } from '../../../components/ui'

const CHANNEL_OPTIONS = [
  { id: 'IN_APP', label: 'In-App' },
  { id: 'PUSH', label: 'Push' },
  { id: 'POPUP', label: 'Pop-up (must-see)' },
  { id: 'SMS', label: 'SMS (stub)' },
  { id: 'EMAIL', label: 'Email (stub)' },
]

const TARGET_OPTIONS = [
  { id: 'ALL', label: 'All users' },
  { id: 'BUYERS', label: 'Buyers only' },
  { id: 'SELLERS', label: 'Sellers only' },
  { id: 'SELECTED', label: 'Specific users' },
]

const STATUS_ICONS: Record<string, React.ElementType> = {
  QUEUED: Clock, SENDING: Clock, DONE: CheckCircle, FAILED: XCircle,
}

interface BroadcastPage { items: AdminBroadcast[]; total: number }
interface UserSuggestion { id: string; name: string; telegramId?: string }

const EMPTY_FORM = {
  title: '', body: '', channels: ['IN_APP'] as string[], targetType: 'ALL',
  targetIds: [] as string[], isPopup: false, expiresAt: '',
}

export default function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [userSearch, setUserSearch] = useState('')
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api.get<BroadcastPage>('/admin/broadcasts?limit=20')
    if (res.success) { setBroadcasts(res.data.items); setTotal(res.data.total) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUserSuggestions([]); return }
    const res = await api.get<{ items: UserSuggestion[] }>(`/admin/users?q=${encodeURIComponent(q)}&limit=8`)
    if (res.success) setUserSuggestions(res.data.items)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300)
    return () => clearTimeout(t)
  }, [userSearch, searchUsers])

  function toggleChannel(id: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(id) ? f.channels.filter((c) => c !== id) : [...f.channels, id],
      isPopup: id === 'POPUP' ? !f.channels.includes(id) : f.isPopup,
    }))
  }

  function addUser(u: UserSuggestion) {
    if (!form.targetIds.includes(u.id)) setForm((f) => ({ ...f, targetIds: [...f.targetIds, u.id] }))
    setUserSearch('')
    setUserSuggestions([])
  }

  function removeUser(id: string) {
    setForm((f) => ({ ...f, targetIds: f.targetIds.filter((x) => x !== id) }))
  }

  async function submit() {
    if (!form.title || !form.body) { setError('Title and body are required'); return }
    if (form.channels.length === 0) { setError('Select at least one channel'); return }
    if (form.targetType === 'SELECTED' && form.targetIds.length === 0) { setError('Add at least one user'); return }
    setError('')
    setSending(true)
    const res = await api.post('/admin/broadcasts', { ...form, expiresAt: form.expiresAt || undefined })
    if (res.success) {
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } else {
      setError((res as any).message ?? 'Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`Send messages to your community · ${total} broadcasts sent`}
        actions={<Button variant="primary" size="sm" onClick={() => setShowForm((v) => !v)}><Bell size={14} /> New Broadcast</Button>}
      />

      {showForm && (
        <Card padded className="space-y-5">
          <CardTitle className="text-base">Compose Broadcast</CardTitle>

          {error && <p className="text-sm px-3 py-2 rounded-lg bg-action-100 text-action-700">{error}</p>}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1 text-ink-700">Title</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Platform maintenance notice" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-ink-700">Body</label>
              <Textarea rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Write your message here…" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2 text-ink-700">Channels</label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((ch) => {
                const active = form.channels.includes(ch.id)
                return (
                  <button
                    key={ch.id} onClick={() => toggleChannel(ch.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-ink-900 border-canvas-400'
                    }`}
                  >
                    {ch.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2 text-ink-700">Send to</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map((t) => {
                const active = form.targetType === t.id
                return (
                  <button
                    key={t.id} onClick={() => setForm((f) => ({ ...f, targetType: t.id, targetIds: [] }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-900 border-canvas-400'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {form.targetType === 'SELECTED' && (
              <div className="mt-3 relative">
                <Input placeholder="Search users by name…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                {userSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg border border-canvas-300 shadow-[var(--shadow-popover)] bg-white">
                    {userSuggestions.map((u) => (
                      <button key={u.id} onClick={() => addUser(u)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-canvas-100 text-left">
                        <User size={13} className="text-ink-300" />
                        <span className="text-ink-900">{u.name}</span>
                        {u.telegramId && <span className="text-ink-300 text-[11px]">@{u.telegramId}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {form.targetIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.targetIds.map((id) => (
                      <Badge key={id} tone="brand" className="gap-1.5">
                        {id.slice(0, 8)}…
                        <button onClick={() => removeUser(id)} className="opacity-60 hover:opacity-100">✕</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {form.channels.includes('POPUP') && (
            <div>
              <label className="text-xs font-semibold block mb-1 text-ink-700">Pop-up Expiry (optional)</label>
              <Input type="datetime-local" className="w-fit" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="primary" onClick={submit} disabled={sending}>
              <Send size={14} /> {sending ? 'Sending…' : 'Send Broadcast'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError('') }}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-brand-600" />
            <CardTitle>Broadcast History</CardTitle>
          </div>
        </CardHeader>

        {loading ? <LoadingState /> : broadcasts.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-400">No broadcasts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <THead>
                <tr><Th>Title</Th><Th>Target</Th><Th>Channels</Th><Th>Sent</Th><Th>Status</Th><Th>Date</Th></tr>
              </THead>
              <tbody>
                {broadcasts.map((b) => {
                  const StatusIcon = STATUS_ICONS[b.status] ?? Clock
                  const statusTone = b.status === 'FAILED' ? 'action' : b.status === 'DONE' ? 'brand' : 'value'
                  return (
                    <Tr key={b.id}>
                      <Td>
                        <div className="font-medium text-ink-900">{b.title}</div>
                        <div className="text-xs mt-0.5 text-ink-400 line-clamp-1">{b.body}</div>
                      </Td>
                      <Td>{b.targetType}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {(b.channels as string[]).map((ch) => <Badge key={ch} tone="brand">{ch}</Badge>)}
                        </div>
                      </Td>
                      <Td className="font-semibold text-ink-900">{b.sentCount}</Td>
                      <Td>
                        <span className={`flex items-center gap-1 text-xs font-semibold ${statusTone === 'action' ? 'text-action-600' : statusTone === 'brand' ? 'text-brand-600' : 'text-value-700'}`}>
                          <StatusIcon size={13} /> {b.status}
                        </span>
                      </Td>
                      <Td className="text-ink-400">
                        {new Date(b.createdAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
