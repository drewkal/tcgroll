// src/app/admin/cases/[id]/editor.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { Save, Trash2, ChevronLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'

interface Card {
  id: string
  name: string
  rarity: string
  value: number
  pokemonType: string
}

interface CaseCard {
  id: string
  cardId: string
  dropRate: number
  card: Card
}

interface CardCase {
  id: string
  name: string
  slug: string
  description?: string | null
  price: number
  tier: string
  featured: boolean
  active: boolean
  cardCount: number
  imageUrl?: string | null
  caseCards: CaseCard[]
}

interface Props {
  cardCase?: CardCase
  allCards: Card[]
  isNew: boolean
}

const TIERS = ['STARTER', 'STANDARD', 'PREMIUM', 'ELITE', 'LEGENDARY']

export function AdminCaseEditor({ cardCase, allCards, isNew }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: cardCase?.name ?? '',
    slug: cardCase?.slug ?? '',
    description: cardCase?.description ?? '',
    price: cardCase?.price ?? 4.99,
    tier: cardCase?.tier ?? 'STANDARD',
    featured: cardCase?.featured ?? false,
    active: cardCase?.active ?? true,
    cardCount: cardCase?.cardCount ?? 5,
    imageUrl: cardCase?.imageUrl ?? '',
  })

  const [caseCards, setCaseCards] = useState<Array<{ cardId: string; dropRate: number; card: Card }>>(
    cardCase?.caseCards.map(cc => ({ cardId: cc.cardId, dropRate: cc.dropRate, card: cc.card })) ?? []
  )
  const [selectedCardId, setSelectedCardId] = useState('')
  const [newDropRate, setNewDropRate] = useState(5)

  const totalDropRate = caseCards.reduce((s, cc) => s + cc.dropRate, 0)

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error('Name and slug are required'); return }
    if (Math.abs(totalDropRate - 100) > 0.1) {
      toast.error(`Drop rates must total 100%. Currently: ${totalDropRate.toFixed(2)}%`)
      return
    }
    setSaving(true)
    try {
      const url = isNew ? '/api/cases' : `/api/cases/${cardCase!.id}`
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
      if (!res.ok) { toast.error('Failed to save case'); return }
      toast.success(isNew ? 'Case created!' : 'Case updated!')
      router.push('/admin')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Deactivate this case? It will be hidden from users.')) return
    const res = await fetch(`/api/cases/${cardCase!.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Case deactivated'); router.push('/admin') }
    else toast.error('Failed to deactivate case')
  }

  const addCard = () => {
    if (!selectedCardId) return
    const card = allCards.find(c => c.id === selectedCardId)!
    if (caseCards.find(cc => cc.cardId === selectedCardId)) {
      toast.error('Card already in case')
      return
    }
    setCaseCards(prev => [...prev, { cardId: selectedCardId, dropRate: newDropRate, card }])
    setSelectedCardId('')
  }

  const removeCard = (cardId: string) => {
    setCaseCards(prev => prev.filter(cc => cc.cardId !== cardId))
  }

  const updateDropRate = (cardId: string, rate: number) => {
    setCaseCards(prev => prev.map(cc => cc.cardId === cardId ? { ...cc, dropRate: rate } : cc))
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm(prev => ({ ...prev, [k]: val }))
  }

  const rarityColors: Record<string, string> = {
    LEGENDARY: '#f59e0b', EPIC: '#a855f7', RARE: '#3b82f6', UNCOMMON: '#22c55e', COMMON: '#9ca3af'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-slate-400 hover:text-yellow-400 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-display text-4xl text-white tracking-wide">
          {isNew ? 'NEW CASE' : `EDIT: ${cardCase?.name}`}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: basic fields */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-5">
          <h2 className="font-display text-xl text-white tracking-wide border-b border-white/5 pb-3">CASE DETAILS</h2>

          {[
            { key: 'name', label: 'NAME', type: 'text', placeholder: 'Legendary Vault' },
            { key: 'slug', label: 'SLUG', type: 'text', placeholder: 'legendary-vault' },
            { key: 'imageUrl', label: 'IMAGE URL', type: 'text', placeholder: '/cases/legendary.png' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form] as string}
                onChange={set(key as keyof typeof form)}
                placeholder={placeholder}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 text-sm"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">PRICE ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={set('price')}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">CARDS PER OPEN</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.cardCount}
                onChange={set('cardCount')}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">TIER</label>
            <select
              value={form.tier}
              onChange={set('tier')}
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50 text-sm"
            >
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex gap-6">
            {[
              { key: 'featured', label: 'Featured on homepage' },
              { key: 'active', label: 'Active (visible to users)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={set(key as keyof typeof form)}
                  className="w-4 h-4 rounded accent-yellow-400"
                />
                <span className="text-sm text-slate-400">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Right: card drop rates */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="font-display text-xl text-white tracking-wide">DROP RATES</h2>
            <div className={`font-mono text-sm ${Math.abs(totalDropRate - 100) < 0.1 ? 'text-green-400' : 'text-red-400'}`}>
              {totalDropRate.toFixed(1)}% / 100%
            </div>
          </div>

          {/* Add card */}
          <div className="flex gap-2">
            <select
              value={selectedCardId}
              onChange={e => setSelectedCardId(e.target.value)}
              className="flex-1 bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/50"
            >
              <option value="">Select card...</option>
              {allCards
                .filter(c => !caseCards.find(cc => cc.cardId === c.id))
                .map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.rarity}] {c.name} — {formatCurrency(c.value)}
                  </option>
                ))
              }
            </select>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={newDropRate}
              onChange={e => setNewDropRate(parseFloat(e.target.value))}
              className="w-20 bg-navy-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              placeholder="%"
            />
            <button
              onClick={addCard}
              className="btn-gold px-3 py-2 rounded-xl text-sm"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Cards list */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {caseCards.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No cards added yet</p>
            ) : (
              caseCards.map(cc => (
                <div key={cc.cardId} className="flex items-center gap-3 p-2 rounded-lg bg-navy-800 border border-white/5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rarityColors[cc.card.rarity] ?? '#9ca3af' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{cc.card.name}</div>
                    <div className="text-xs text-slate-500">{formatCurrency(cc.card.value)}</div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={cc.dropRate}
                    onChange={e => updateDropRate(cc.cardId, parseFloat(e.target.value))}
                    className="w-16 bg-navy-700 border border-white/10 rounded px-2 py-1 text-white text-xs text-right focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <button
                    onClick={() => removeCard(cc.cardId)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4">
        {!isNew && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <Trash2 size={16} />
            Deactivate Case
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold ml-auto flex items-center gap-2 px-6 py-3 rounded-xl font-display tracking-wider text-sm"
        >
          {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          {isNew ? 'CREATE CASE' : 'SAVE CHANGES'}
        </button>
      </div>
    </div>
  )
}
