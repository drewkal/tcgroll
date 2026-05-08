// src/app/collection/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CardDisplay } from '@/components/cards/card-display'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { LayoutGrid, DollarSign, Filter, Truck } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type UserCard = {
  id: string
  cardId: string
  obtainedAt: string
  sold: boolean
  card: {
    id: string
    name: string
    imageUrl: string | null
    rarity: string
    value: number
    pokemonType: string
    setName: string | null
  }
}

const RARITIES = ['ALL', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']

export default function CollectionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRarity, setSelectedRarity] = useState('ALL')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [isSelling, setIsSelling] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchCollection = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/collection')
      const data = await res.json()
      setCards(data)
    } catch {
      toast.error('Failed to load collection')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchCollection()
  }, [session, fetchCollection])

  const filteredCards = selectedRarity === 'ALL'
    ? cards
    : cards.filter(uc => uc.card.rarity === selectedRarity)

  const toggleCard = (id: string) => {
    setSelectedCards(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedCards(new Set(filteredCards.map(uc => uc.id)))
  }

  const clearSelection = () => setSelectedCards(new Set())

  const selectedValue = cards
    .filter(uc => selectedCards.has(uc.id))
    .reduce((sum, uc) => sum + uc.card.value, 0)

  const handleSell = async () => {
    if (selectedCards.size === 0) return
    setIsSelling(true)
    try {
      const res = await fetch('/api/user/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardIds: Array.from(selectedCards) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Sold ${data.soldCount} card${data.soldCount > 1 ? 's' : ''} for ${formatCurrency(data.totalValue)}!`)
      setSelectedCards(new Set())
      fetchCollection()
    } catch {
      toast.error('Failed to sell cards')
    } finally {
      setIsSelling(false)
    }
  }

  const totalValue = cards.reduce((sum, uc) => sum + uc.card.value, 0)

  const rarityCount = cards.reduce<Record<string, number>>((acc, uc) => {
    acc[uc.card.rarity] = (acc[uc.card.rarity] ?? 0) + 1
    return acc
  }, {})

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— YOUR CARDS</p>
          <h1 className="font-display text-6xl tracking-wide text-white">COLLECTION</h1>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-xs font-mono text-slate-500 tracking-wider">TOTAL CARDS</div>
            <div className="font-display text-3xl text-white">{cards.length}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-slate-500 tracking-wider">TOTAL VALUE</div>
            <div className="font-display text-3xl text-yellow-400">{formatCurrency(totalValue)}</div>
          </div>
        </div>
      </div>

      {/* Rarity breakdown pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {RARITIES.map(rarity => {
          const count = rarity === 'ALL' ? cards.length : (rarityCount[rarity] ?? 0)
          const color = rarity === 'ALL' ? '#fbbf24' : getRarityColor(rarity)
          const isActive = selectedRarity === rarity
          return (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={cn(
                'px-4 py-2 rounded-lg font-mono text-sm transition-all border',
                isActive
                  ? 'text-black font-bold'
                  : 'bg-navy-800 border-white/10 hover:border-white/20',
              )}
              style={isActive
                ? { backgroundColor: color, borderColor: color }
                : { color }}
            >
              {rarity} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Selection toolbar */}
      {cards.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 glass rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter size={14} />
            <span>{selectedCards.size} selected</span>
            {selectedCards.size > 0 && (
              <span className="text-yellow-400 font-mono">— {formatCurrency(selectedValue)}</span>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={selectAllVisible}
              className="px-3 py-1.5 rounded-lg text-xs font-mono border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              Select All ({filteredCards.length})
            </button>
            {selectedCards.size > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono border border-white/10 text-slate-400 hover:text-white transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={handleSell}
                  disabled={isSelling}
                  className="btn-gold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                >
                  <DollarSign size={12} />
                  {isSelling ? 'Selling...' : `Sell for ${formatCurrency(selectedValue)}`}
                </button>
                <Link
                  href={`/withdraw?cards=${Array.from(selectedCards).join(',')}`}
                  className="px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 bg-navy-700 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all"
                >
                  <Truck size={12} /> Withdraw
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cards grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-32 text-slate-500">
          <LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-2xl mb-2">
            {cards.length === 0 ? 'No Cards Yet' : 'No Cards in This Rarity'}
          </p>
          <p className="text-sm">
            {cards.length === 0
              ? <a href="/cases" className="text-yellow-400 hover:underline">Open some cases to start your collection!</a>
              : 'Try a different rarity filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCards.map(userCard => (
            <CardDisplay
              key={userCard.id}
              card={userCard.card as any}
              size="md"
              selected={selectedCards.has(userCard.id)}
              onSelect={() => toggleCard(userCard.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
