// src/app/admin/cards/client.tsx
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Plus, Save, X, Edit, Trash2 } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']
const TYPES = ['NORMAL','FIRE','WATER','GRASS','ELECTRIC','ICE','FIGHTING','POISON','GROUND','FLYING','PSYCHIC','BUG','ROCK','GHOST','DRAGON','DARK','STEEL','FAIRY']
const GAME_OPTIONS = [
  { value: 'POKEMON', label: 'Pokémon' },
  { value: 'ONE_PIECE', label: 'One Piece' },
  { value: 'MAGIC', label: 'Magic: The Gathering' },
  { value: 'DRAGON_BALL', label: 'Dragon Ball' },
]

interface Card {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  value: number
  pokemonType: string
  setName: string | null
}

const emptyForm = { name: '', imageUrl: '', rarity: 'COMMON', value: 1, game: 'POKEMON', pokemonType: 'NORMAL', setName: '' }

type Mode = 'none' | 'create' | 'edit'

export function AdminCardsClient({ cards: initialCards }: { cards: Card[] }) {
  const [cards, setCards]           = useState(initialCards)
  const [mode, setMode]             = useState<Mode>('none')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState({ ...emptyForm })
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [rarityFilter, setRarityFilter] = useState('ALL')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: k === 'value' ? parseFloat(e.target.value) : e.target.value }))

  const openCreate = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setMode('create')
  }

  const openEdit = (card: Card) => {
    setForm({
      name: card.name,
      imageUrl: card.imageUrl ?? '',
      rarity: card.rarity,
      value: card.value,
      game: (card as any).game ?? 'POKEMON',
      pokemonType: card.pokemonType,
      setName: card.setName ?? '',
    })
    setEditingId(card.id)
    setMode('edit')
  }

  const closeForm = () => { setMode('none'); setEditingId(null) }

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const card = await res.json()
      if (!res.ok) { toast.error(card.error); return }
      setCards(prev => [card, ...prev])
      closeForm()
      toast.success('Card created!')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!form.name || !editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cards/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const updated = await res.json()
      if (!res.ok) { toast.error(updated.error); return }
      setCards(prev => prev.map(c => c.id === editingId ? updated : c))
      closeForm()
      toast.success('Card updated!')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete card'); return }
      setCards(prev => prev.filter(c => c.id !== id))
      if (editingId === id) closeForm()
      toast.success('Card deleted')
    } catch {
      toast.error('Failed to delete card')
    }
  }

  const filtered = cards.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchRarity = rarityFilter === 'ALL' || c.rarity === rarityFilter
    return matchSearch && matchRarity
  })

  const inputClass = 'w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50'

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest mb-1">— ADMIN</p>
          <h1 className="font-display text-5xl text-white tracking-wide">CARD MANAGEMENT</h1>
        </div>
        <button
          onClick={mode === 'none' ? openCreate : closeForm}
          className="btn-gold px-5 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center gap-2"
        >
          {mode !== 'none' ? <X size={16} /> : <Plus size={16} />}
          {mode !== 'none' ? 'Cancel' : 'New Card'}
        </button>
      </div>

      {/* Create / Edit form */}
      {mode !== 'none' && (
        <div className="glass rounded-2xl border border-yellow-400/20 p-6">
          <h2 className="font-display text-xl text-white tracking-wide mb-5">
            {mode === 'create' ? 'CREATE NEW CARD' : `EDIT: ${form.name}`}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">NAME</label>
              <input type="text" value={form.name} onChange={set('name')} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">SET NAME</label>
              <input type="text" value={form.setName} onChange={set('setName')} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">VALUE ($)</label>
              <input type="number" step="0.01" min="0" value={form.value} onChange={set('value')} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">GAME</label>
              <select value={form.game} onChange={set('game')} className={inputClass}>
                {GAME_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">RARITY</label>
              <select value={form.rarity} onChange={set('rarity')} className={inputClass}>
                {RARITIES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            {form.game === 'POKEMON' && (
              <div>
                <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">POKEMON TYPE</label>
                <select value={form.pokemonType} onChange={set('pokemonType')} className={inputClass}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2 md:col-span-3">
              <ImageUpload
                value={form.imageUrl}
                onChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={mode === 'create' ? handleCreate : handleUpdate}
              disabled={saving}
              className="btn-gold px-6 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
              {mode === 'create' ? 'Create Card' : 'Save Changes'}
            </button>
            <button onClick={closeForm} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search cards..."
          className="bg-navy-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/50 w-64"
        />
        <div className="flex gap-2">
          {['ALL', ...RARITIES].map(r => (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                rarityFilter === r ? 'bg-yellow-400 text-black border-yellow-400 font-bold' : 'border-white/10 text-slate-400 hover:border-yellow-400/30'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Cards table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr>
              {['Card Name', 'Set', 'Game', 'Rarity', 'Value', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-mono text-slate-500 tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/3">
            {filtered.map(card => (
              <tr
                key={card.id}
                className={`hover:bg-white/2 transition-colors ${editingId === card.id ? 'bg-yellow-400/5' : ''}`}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {card.imageUrl && (
                      <img src={card.imageUrl} alt={card.name} className="w-8 h-10 object-contain rounded" />
                    )}
                    <span className="text-white font-medium">{card.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs">{card.setName ?? '—'}</td>
                <td className="px-5 py-3 text-slate-400 text-xs font-mono">{(card as any).game ?? 'POKEMON'}</td>
                <td className="px-5 py-3">
                  <span className="rarity-badge" style={{
                    color: getRarityColor(card.rarity),
                    backgroundColor: `${getRarityColor(card.rarity)}20`,
                  }}>
                    {card.rarity}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-yellow-400">{formatCurrency(card.value)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(card)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-navy-700 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      <Edit size={11} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(card.id, card.name)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">No cards found</div>
        )}
      </div>
    </div>
  )
}
