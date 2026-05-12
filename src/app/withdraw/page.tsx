// src/app/withdraw/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CardDisplay } from '@/components/cards/card-display'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Package, ChevronLeft, Truck, CheckCircle, Filter } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type UserCard = {
  id: string
  card: { id: string; name: string; imageUrl: string | null; rarity: string; value: number; pokemonType: string; setName: string | null }
}

const RARITIES = ['ALL', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'Other']

export default function WithdrawPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [cards,          setCards]          = useState<UserCard[]>([])
  const [loading,        setLoading]        = useState(true)
  const [selectedCards,  setSelectedCards]  = useState<Set<string>>(new Set())
  const [selectedRarity, setSelectedRarity] = useState('ALL')
  const [submitting,     setSubmitting]     = useState(false)
  const [submitted,      setSubmitted]      = useState(false)

  const [form, setForm] = useState({
    fullName: '', email: '', address: '', city: '',
    state: '', zipCode: '', country: 'United States', phone: '', notes: '',
  })

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => { if (session?.user?.email) setForm(f => ({ ...f, email: session.user.email ?? '' })) }, [session])

  const fetchCards = useCallback(async () => {
    try {
      const res  = await fetch('/api/user/collection')
      const data = await res.json()
      // Only show cards not sold/withdrawn
      setCards(data.filter((uc: any) => !uc.sold && !uc.withdrawn))
    } catch {
      toast.error('Failed to load cards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session) fetchCards() }, [session, fetchCards])

  const filtered = selectedRarity === 'ALL' ? cards : cards.filter(uc => uc.card.rarity === selectedRarity)
  const toggleCard = (id: string) => setSelectedCards(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const selectedValue = cards.filter(uc => selectedCards.has(uc.id)).reduce((s, uc) => s + uc.card.value, 0)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const MIN_WITHDRAW = 1000
  const meetsMinimum = selectedValue >= MIN_WITHDRAW

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCards.size === 0) { toast.error('Select at least one card to withdraw'); return }
    if (!meetsMinimum) { toast.error(`Minimum withdrawal is 🪙 1,000 tokens`); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardIds: Array.from(selectedCards), ...form }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to submit'); return }
      setSubmitted(true)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h1 className="font-display text-4xl text-white tracking-wide mb-3">REQUEST SUBMITTED</h1>
        <p className="text-slate-400 mb-2">
          We've received your withdrawal request for <span className="text-white font-mono">{selectedCards.size}</span> card{selectedCards.size > 1 ? 's' : ''}.
        </p>
        <p className="text-slate-500 text-sm mb-8">We'll review it and ship your cards. You can track your request status in your profile.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/collection" className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-colors text-sm">
            Back to Collection
          </Link>
          <Link href="/cases" className="btn-gold px-5 py-2.5 rounded-xl text-sm">
            Open More Cases
          </Link>
        </div>
      </div>
    </div>
  )

  const inputClass = 'w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm'
  const labelClass = 'block text-xs font-mono text-slate-400 tracking-wider mb-2'

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/collection" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> Back to Collection
      </Link>

      <div className="mb-8">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— PHYSICAL REDEMPTION</p>
        <h1 className="font-display text-6xl tracking-wide text-white">WITHDRAW CARDS</h1>
        <p className="text-slate-400 mt-3">Select cards from your collection and enter your shipping details. We'll mail the physical cards to you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Card selector ─────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-white tracking-wide flex items-center gap-2">
              <Package size={20} className="text-yellow-400" /> SELECT CARDS
            </h2>
            <span className="text-xs font-mono text-slate-500">{cards.length} available</span>
          </div>

          {/* Rarity filter */}
          <div className="flex flex-wrap gap-2">
            {RARITIES.map(r => {
              const color = r === 'ALL' ? '#fbbf24' : getRarityColor(r)
              const active = selectedRarity === r
              return (
                <button key={r} onClick={() => setSelectedRarity(r)}
                  className={cn('px-3 py-1 rounded-lg font-mono text-xs transition-all border', active ? 'text-black font-bold' : 'bg-navy-800 border-white/10 hover:border-white/20')}
                  style={active ? { backgroundColor: color, borderColor: color } : { color }}
                >
                  {r}
                </button>
              )
            })}
          </div>

          {/* Selection toolbar */}
          {cards.length > 0 && (
            <div className="flex items-center gap-3 p-3 glass rounded-xl border border-white/5 text-sm">
              <Filter size={13} className="text-slate-500" />
              <span className="text-slate-400 font-mono">{selectedCards.size} selected</span>
              {selectedCards.size > 0 && <span className="text-yellow-400 font-mono">— {formatCurrency(selectedValue)}</span>}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setSelectedCards(new Set(filtered.map(uc => uc.id)))}
                  className="px-2 py-1 rounded-lg text-xs font-mono border border-white/10 text-slate-400 hover:text-white transition-all">
                  All ({filtered.length})
                </button>
                {selectedCards.size > 0 && (
                  <button onClick={() => setSelectedCards(new Set())}
                    className="px-2 py-1 rounded-lg text-xs font-mono border border-white/10 text-slate-400 hover:text-white transition-all">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Package size={40} className="mb-3 opacity-30" />
              <p>{cards.length === 0 ? 'No cards available to withdraw' : 'No cards in this rarity'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map(uc => (
                <div key={uc.id} onClick={() => toggleCard(uc.id)}
                  className={cn('cursor-pointer rounded-xl transition-all', selectedCards.has(uc.id) ? 'ring-2 ring-yellow-400 scale-95' : 'hover:scale-105')}>
                  <CardDisplay card={uc.card as any} size="sm" selected={selectedCards.has(uc.id)} onSelect={() => toggleCard(uc.id)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Shipping form ─────────────────────── */}
        <div>
          <h2 className="font-display text-2xl text-white tracking-wide mb-5 flex items-center gap-2">
            <Truck size={20} className="text-yellow-400" /> SHIPPING INFO
          </h2>

          <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>FULL NAME *</label>
                <input required value={form.fullName} onChange={set('fullName')} placeholder="John Smith" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>EMAIL *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>STREET ADDRESS *</label>
                <input required value={form.address} onChange={set('address')} placeholder="123 Main St, Apt 4" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CITY *</label>
                <input required value={form.city} onChange={set('city')} placeholder="New York" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>STATE / PROVINCE *</label>
                <input required value={form.state} onChange={set('state')} placeholder="NY" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>ZIP / POSTAL CODE *</label>
                <input required value={form.zipCode} onChange={set('zipCode')} placeholder="10001" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>COUNTRY *</label>
                <select required value={form.country} onChange={set('country')}
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50 transition-colors text-sm">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>PHONE (OPTIONAL)</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>NOTES (OPTIONAL)</label>
                <textarea value={form.notes} onChange={set('notes') as any} placeholder="Any special instructions..."
                  rows={3} className={inputClass + ' resize-none'} />
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-white/5 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cards to withdraw</span>
                <span className="font-mono text-white">{selectedCards.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total card value</span>
                <span className={cn('font-mono', meetsMinimum ? 'text-yellow-400' : 'text-red-400')}>{formatCurrency(selectedValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Minimum required</span>
                <span className="font-mono text-slate-500">🪙 1,000</span>
              </div>
              {selectedCards.size > 0 && !meetsMinimum && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-2">
                  Add {formatCurrency(MIN_WITHDRAW - selectedValue)} more to meet the minimum
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || selectedCards.size === 0 || !meetsMinimum}
              className={cn(
                'w-full py-4 rounded-xl font-display text-xl tracking-widest flex items-center justify-center gap-3 transition-all',
                selectedCards.size > 0 && meetsMinimum ? 'btn-gold' : 'bg-navy-700 text-slate-500 cursor-not-allowed border border-white/5',
              )}
            >
              {submitting
                ? <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> SUBMITTING...</>
                : <><Truck size={20} /> SUBMIT REQUEST</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
