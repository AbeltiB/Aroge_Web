'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Send, Users, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { api } from '../../../lib/api'
import type { AdminBroadcast } from 'aroge-sdk'

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

const STATUS_COLORS: Record<string, string> = {
  QUEUED: '#c89b3c',
  SENDING: '#1f7a5a',
  DONE: '#1f7a5a',
  FAILED: '#B85C2A',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  QUEUED: Clock,
  SENDING: Clock,
  DONE: CheckCircle,
  FAILED: XCircle,
}

interface BroadcastPage { items: AdminBroadcast[]; total: number }
interface UserSuggestion { id: string; name: string; telegramId?: string }

const EMPTY_FORM = {
  title: '',
  body: '',
  channels: ['IN_APP'] as string[],
  targetType: 'ALL',
  targetIds: [] as string[],
  isPopup: false,
  expiresAt: '',
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
    if (!form.targetIds.includes(u.id)) {
      setForm((f) => ({ ...f, targetIds: [...f.targetIds, u.id] }))
    }
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
    const res = await api.post('/admin/broadcasts', {
      ...form,
      expiresAt: form.expiresAt || undefined,
    })
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a3028' }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(31,122,90,0.55)' }}>
            Send messages to your community · {total} broadcasts sent
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: '#1f7a5a', color: '#f3efe7' }}
        >
          <Bell size={14} />
          New Broadcast
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="rounded-xl p-6 space-y-5 border" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
          <h2 className="font-bold text-base" style={{ color: '#1a3028' }}>Compose Broadcast</h2>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(184,92,42,0.08)', color: '#B85C2A' }}>
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: '#1a3028' }}>Title</label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Platform maintenance notice"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: '#1a3028' }}>Body</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none focus:ring-2"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your message here…"
              />
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: '#1a3028' }}>Channels</label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((ch) => {
                const active = form.channels.includes(ch.id)
                return (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      background: active ? '#1f7a5a' : '#ffffff',
                      color: active ? '#f3efe7' : '#1a3028',
                      borderColor: active ? '#1f7a5a' : 'rgba(31,122,90,0.2)',
                    }}
                  >
                    {ch.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: '#1a3028' }}>Send to</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map((t) => {
                const active = form.targetType === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setForm((f) => ({ ...f, targetType: t.id, targetIds: [] }))}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      background: active ? '#1a3028' : '#ffffff',
                      color: active ? '#f3efe7' : '#1a3028',
                      borderColor: active ? '#1a3028' : 'rgba(31,122,90,0.2)',
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {form.targetType === 'SELECTED' && (
              <div className="mt-3 relative">
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                  placeholder="Search users by name…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.15)' }}>
                    {userSuggestions.map((u) => (
                      <button key={u.id} onClick={() => addUser(u)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left">
                        <User size={13} />
                        <span style={{ color: '#1a3028' }}>{u.name}</span>
                        {u.telegramId && <span style={{ color: 'rgba(31,122,90,0.45)', fontSize: 11 }}>@{u.telegramId}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {form.targetIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.targetIds.map((id) => (
                      <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: '#e6f0eb', color: '#1f7a5a' }}>
                        {id.slice(0, 8)}…
                        <button onClick={() => removeUser(id)} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expiry (for popups) */}
          {form.channels.includes('POPUP') && (
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#1a3028' }}>Pop-up Expiry (optional)</label>
              <input
                type="datetime-local"
                className="rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'rgba(31,122,90,0.2)', color: '#1a3028' }}
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={submit}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: '#1f7a5a', color: '#f3efe7' }}
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError('') }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: 'rgba(31,122,90,0.6)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Broadcast history */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#ffffff', borderColor: 'rgba(31,122,90,0.12)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(31,122,90,0.10)' }}>
          <Users size={14} style={{ color: '#1f7a5a' }} />
          <span className="font-semibold text-sm" style={{ color: '#1a3028' }}>Broadcast History</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>Loading…</div>
        ) : broadcasts.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'rgba(31,122,90,0.45)' }}>No broadcasts yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(31,122,90,0.08)' }}>
                {['Title', 'Target', 'Channels', 'Sent', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'rgba(31,122,90,0.55)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => {
                const StatusIcon = STATUS_ICONS[b.status] ?? Clock
                return (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50" style={{ borderColor: 'rgba(31,122,90,0.06)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: '#1a3028' }}>
                      <div>{b.title}</div>
                      <div className="text-xs mt-0.5 opacity-60 line-clamp-1">{b.body}</div>
                    </td>
                    <td className="px-5 py-3" style={{ color: '#444444' }}>{b.targetType}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(b.channels as string[]).map((ch) => (
                          <span key={ch} className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#e6f0eb', color: '#1f7a5a' }}>{ch}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: '#1a3028' }}>{b.sentCount}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: STATUS_COLORS[b.status] }}>
                        <StatusIcon size={13} />
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'rgba(31,122,90,0.45)' }}>
                      {new Date(b.createdAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
