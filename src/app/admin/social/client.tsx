'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Save, Globe } from 'lucide-react'
import { SocialIcon, PLATFORMS, getPlatformColor, getPlatformLabel } from '@/components/social-icons'
import { cn } from '@/lib/utils'

type SocialLink = { id: string; platform: string; url: string; active: boolean; order: number }

const inputClass = 'w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm'

export function SocialAdminClient({ initialLinks }: { initialLinks: SocialLink[] }) {
  const [links, setLinks]       = useState<SocialLink[]>(initialLinks)
  const [saving, setSaving]     = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [adding, setAdding]     = useState(false)

  const [newPlatform, setNewPlatform] = useState('twitter')
  const [newUrl, setNewUrl]           = useState('')

  async function handleAdd() {
    if (!newUrl.trim()) { toast.error('Enter a URL'); return }
    if (links.some(l => l.platform === newPlatform)) { toast.error('That platform already exists'); return }
    setAdding(true)
    try {
      const res  = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: newPlatform, url: newUrl.trim(), active: true, order: links.length }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
      setLinks(prev => [...prev, data])
      setNewUrl('')
      toast.success('Social link added')
    } finally { setAdding(false) }
  }

  async function handleSave(link: SocialLink) {
    setSaving(link.id)
    try {
      const res  = await fetch(`/api/admin/social/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link.url, active: link.active, order: link.order }),
      })
      if (!res.ok) { toast.error('Failed to save'); return }
      toast.success('Saved')
    } finally { setSaving(null) }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/social/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete'); return }
      setLinks(prev => prev.filter(l => l.id !== id))
      toast.success('Deleted')
    } finally { setDeleting(null) }
  }

  function update(id: string, patch: Partial<SocialLink>) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— ADMIN</p>
        <h1 className="font-display text-5xl tracking-wide text-white">SOCIAL LINKS</h1>
        <p className="text-slate-400 mt-2 text-sm">Manage the social media icons displayed in the site footer.</p>
      </div>

      {/* Add new */}
      <div className="glass rounded-2xl border border-white/5 p-6 mb-6">
        <h2 className="font-display text-xl tracking-wide text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-yellow-400" /> ADD LINK
        </h2>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={newPlatform}
            onChange={e => setNewPlatform(e.target.value)}
            className="bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400/50 text-sm w-40 flex-shrink-0"
          >
            {PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://..."
            className={cn(inputClass, 'flex-1')}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-gold px-5 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center gap-2 flex-shrink-0"
          >
            {adding ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          {PLATFORMS.map(p => {
            const color = getPlatformColor(p.value)
            return (
              <button
                key={p.value}
                onClick={() => setNewPlatform(p.value)}
                className={cn('p-2 rounded-lg border transition-all', newPlatform === p.value ? 'border-current' : 'border-white/10 hover:border-white/20')}
                style={{ color: newPlatform === p.value ? color : undefined }}
                title={p.label}
              >
                <SocialIcon platform={p.value} size={18} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Existing links */}
      <div className="space-y-3">
        {links.length === 0 && (
          <div className="text-center py-12 text-slate-500 glass rounded-2xl border border-white/5">
            <Globe size={36} className="mx-auto mb-3 opacity-30" />
            <p>No social links yet. Add one above.</p>
          </div>
        )}
        {links.map(link => {
          const color = getPlatformColor(link.platform)
          return (
            <div key={link.id} className="glass rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-4">
                {/* Icon + label */}
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20', color }}>
                    <SocialIcon platform={link.platform} size={18} />
                  </div>
                  <span className="text-sm font-mono text-white">{getPlatformLabel(link.platform)}</span>
                </div>

                {/* URL input */}
                <input
                  value={link.url}
                  onChange={e => update(link.id, { url: e.target.value })}
                  className={cn(inputClass, 'flex-1')}
                  placeholder="https://..."
                />

                {/* Order */}
                <input
                  type="number"
                  value={link.order}
                  onChange={e => update(link.id, { order: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50 text-center"
                  title="Display order"
                />

                {/* Toggle active */}
                <button
                  onClick={() => update(link.id, { active: !link.active })}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-mono border transition-all flex-shrink-0', link.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-slate-500 border-white/10')}
                >
                  {link.active ? 'Active' : 'Hidden'}
                </button>

                {/* Save */}
                <button
                  onClick={() => handleSave(link)}
                  disabled={saving === link.id}
                  className="p-2 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors flex-shrink-0"
                  title="Save"
                >
                  {saving === link.id ? <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={deleting === link.id}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex-shrink-0"
                  title="Delete"
                >
                  {deleting === link.id ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {links.length > 0 && (
        <div className="mt-6 p-4 glass rounded-xl border border-white/5 text-xs font-mono text-slate-500">
          Preview — icons shown in footer:
          <div className="flex gap-3 mt-3">
            {links.filter(l => l.active).sort((a, b) => a.order - b.order).map(l => (
              <div key={l.id} style={{ color: getPlatformColor(l.platform) }} title={getPlatformLabel(l.platform)}>
                <SocialIcon platform={l.platform} size={20} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
