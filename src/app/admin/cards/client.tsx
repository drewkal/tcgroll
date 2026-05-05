// src/app/admin/cards/client.tsx
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Plus, Save, X } from 'lucide-react'

const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']
const TYPES = ['NORMAL','FIRE','WATER','GRASS','ELECTRIC','ICE','FIGHTING','POISON','GROUND','FLYING','PSYCHIC','BUG','ROCK','GHOST','DRAGON','DARK','STEEL','FAIRY']

interface Card {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  value: number
  pokemonType: string
  setName: string | null
}

const emptyForm = { name: '', imageUrl: '', rarity: 'COMMON', value: 1, pokemonType: 'NORMAL', setName: '' }

export function AdminCardsClient({ cards: initialCards }: { cards: Card[] }) {
  const [cards, setCards] = useState(initialCards)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('ALL')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: k === 'value' ? parseFloat(e.target.value) : e.target.value }))

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
      setForm({ ...emptyForm })
      setShowForm(false)
      toast.success('Card created!')
    } finally {
      setSaving(false)
    }
  }

  const filtered = cards.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchRarity = rarityFilter === 'ALL' || c.rarity === rarityFilter
    return matchSearch && matchRarity
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest mb-1">— ADMIN</p>
          <h1 className="font-display text-5xl text-white tracking-wide">CARD MANAGEMENT</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-gold px-5 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Card'}
        </button>
      </div>

      {/* New card form */}
      {showForm && (
        <div className="glass rounded-2xl border border-yellow-400/20 p-6">
          <h2 className="font-display text-xl text-white tracking-wide mb-5">CREATE NEW CARD</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            {[
              { key: 'name', label: 'NAME', type: 'text' },
              { key: 'imageUrl', label: 'IMAGE URL', type: 'text' },
              { key: 'setName', label: 'SET NAME', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form] as string}
                  onChange={set(key as keyof typeof form)}
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">VALUE ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                onChange={set('value')}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">RARITY</label>
              <select value={form.rarity} onChange={set('rarity')}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                {RARITIES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">POKEMON TYPE</label>
              <select value={form.pokemonType} onChange={set('pokemonType')}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="btn-gold px-6 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
            Create Card
          </button>
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
              {['Card Name', 'Set', 'Type', 'Rarity', 'Value'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-mono text-slate-500 tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/3">
            {filtered.map(card => (
              <tr key={card.id} className="hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 text-white font-medium">{card.name}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{card.setName ?? '—'}</td>
                <td className="px-5 py-3 text-slate-400 text-xs font-mono">{card.pokemonType}</td>
                <td className="px-5 py-3">
                  <span className="rarity-badge" style={{
                    color: getRarityColor(card.rarity),
                    backgroundColor: `${getRarityColor(card.rarity)}20`
                  }}>
                    {card.rarity}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-yellow-400">{formatCurrency(card.value)}</td>
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
