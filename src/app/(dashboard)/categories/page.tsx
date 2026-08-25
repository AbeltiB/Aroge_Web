'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { Category } from 'aroge-sdk'

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nameEn: '', nameAm: '', slug: '', parentId: '' })
  const [saving, setSaving] = useState(false)

  function load() {
    api.get<Category[]>('/categories').then((res) => {
      if (res.success) setCats(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await api.post('/categories', { ...form, parentId: form.parentId || null })
    setForm({ nameEn: '', nameAm: '', slug: '', parentId: '' })
    setSaving(false)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: '#1a3028' }}>Categories</h2>

      <form onSubmit={create} className="bg-white rounded-xl p-5 shadow-sm space-y-3 max-w-lg">
        <h3 className="font-semibold text-sm" style={{ color: '#1a3028' }}>Add Category</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['nameEn', 'nameAm', 'slug'] as const).map((field) => (
            <input
              key={field}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'rgba(31,122,90,0.12)' }}
              placeholder={field === 'nameEn' ? 'English name' : field === 'nameAm' ? 'አማርኛ ስም' : 'slug-format'}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              required={field !== 'slug' ? true : undefined}
            />
          ))}
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ borderColor: 'rgba(31,122,90,0.12)' }}
            value={form.parentId}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
          >
            <option value="">No parent (root)</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.nameEn}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1f7a5a', color: '#f3efe7' }}
        >
          {saving ? 'Saving…' : 'Add Category'}
        </button>
      </form>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm" style={{ color: '#1a3028' }}>{c.nameEn}</p>
                  <p className="text-xs" style={{ color: '#888' }}>{c.nameAm} · /{c.slug}</p>
                </div>
              </div>
              {c.children && c.children.length > 0 && (
                <div className="mt-2 pl-4 space-y-1">
                  {c.children.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#888' }}>└</span>
                      <span className="text-sm" style={{ color: '#444' }}>{ch.nameEn}</span>
                      <span className="text-xs" style={{ color: '#aaa' }}>{ch.nameAm}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
