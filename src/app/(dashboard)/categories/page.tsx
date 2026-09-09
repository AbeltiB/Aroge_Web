'use client'

import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import type { Category } from '@arogenpm/sdk'
import { PageHeader, Card, CardTitle, Button, Input, Select, LoadingState } from '../../../components/ui'
import { CornerDownRight } from 'lucide-react'

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
      <PageHeader title="Categories" />

      <Card padded className="space-y-3 max-w-lg">
        <CardTitle>Add Category</CardTitle>
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(['nameEn', 'nameAm', 'slug'] as const).map((field) => (
              <Input
                key={field}
                placeholder={field === 'nameEn' ? 'English name' : field === 'nameAm' ? 'አማርኛ ስም' : 'slug-format'}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                required={field !== 'slug'}
              />
            ))}
            <Select
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            >
              <option value="">No parent (root)</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add Category'}
          </Button>
        </form>
      </Card>

      {loading ? <LoadingState /> : (
        <div className="space-y-2">
          {cats.map((c) => (
            <Card key={c.id} padded>
              <p className="font-semibold text-sm text-ink-900">{c.nameEn}</p>
              <p className="text-xs text-ink-400 mt-0.5">{c.nameAm} · /{c.slug}</p>
              {c.children && c.children.length > 0 && (
                <div className="mt-3 pl-3 space-y-1.5 border-l-2 border-canvas-300">
                  {c.children.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-1.5 pl-2">
                      <CornerDownRight size={12} className="text-ink-300" />
                      <span className="text-sm text-ink-700">{ch.nameEn}</span>
                      <span className="text-xs text-ink-300">{ch.nameAm}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
