// src/app/exchange/page.tsx
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { ArrowLeftRight, Search, Loader2, Check, X } from 'lucide-react'

type Card = {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  value: number
  game: string
  setName: string | null
}

type UserCard = {
  id: string
  cardId: string
  card: Card
}

const GAME_EMOJI: Record<string, string> = {
  POKEMON: '⚡', ONE_PIECE: '☠️', MAGIC: '✨', DRAGON_BALL: '🐉',
}

const RARITIES = ['ALL', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']

function CardButton({
  card,
  value,
  selected,
  onClick,
}: {
  card: Card
  value?: number
  selected: boolean
  onClick: () => void
}) {
  const color = getRarityColor(card.rarity)
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
      style={{
        borderColor: selected ? color : 'rgba(255,255,255,0.07)',
        background: selected ? color + '18' : 'transparent',
      }}
    >
      <div className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: color + '50' }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base" style={{ background: color + '15' }}>
            {GAME_EMOJI[card.game] ?? '🃏'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{card.name}</p>
        <p className="text-xs text-slate-400 truncate">{card.rarity} · {card.setName ?? card.game}</p>
        <p className="text-xs font-mono mt-0.5" style={{ color }}>{formatCurrency(value ?? card.value)}</p>
      </div>
      {selected && <Check size={14} style={{ color }} className="flex-shrink-0" />}
    </button>
  )
}

export default function ExchangePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [inventory, setInventory] = useState<UserCard[]>([])
  const [catalog, setCatalog] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [myCard, setMyCard] = useState<UserCard | null>(null)
  const [wantCard, setWantCard] = useState<Card | null>(null)

  const [mySearch, setMySearch] = useState('')
  const [myRarity, setMyRarity] = useState('ALL')
  const [wantSearch, setWantSearch] = useState('')
  const [wantRarity, setWantRarity] = useState('ALL')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/exchange')
      if (res.ok) {
        const data = await res.json()
        setInventory(data.inventory)
        setCatalog(data.catalog)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') fetchData()
  }, [status, router, fetchData])

  const filteredInventory = useMemo(() => inventory.filter(uc => {
    const matchRarity = myRarity === 'ALL' || uc.card.rarity === myRarity
    const matchSearch = !mySearch || uc.card.name.toLowerCase().includes(mySearch.toLowerCase())
    return matchRarity && matchSearch
  }), [inventory, myRarity, mySearch])

  const filteredCatalog = useMemo(() => catalog.filter(c => {
    const matchRarity = wantRarity === 'ALL' || c.rarity === wantRarity
    const matchSearch = !wantSearch || c.name.toLowerCase().includes(wantSearch.toLowerCase())
    // Don't show the same card type they're offering
    const notSameCard = !myCard || c.id !== myCard.cardId
    return matchRarity && matchSearch && notSameCard
  }), [catalog, wantRarity, wantSearch, myCard])

  const diff = myCard && wantCard ? wantCard.value - myCard.card.value : null
  const balance = session?.user?.balance ?? 0

  async function handleExchange() {
    if (!myCard || !wantCard) return
    if (diff !== null && diff > 0 && balance < diff) {
      toast.error(`Need ${formatCurrency(diff - balance)} more balance`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardId: myCard.id, wantedCardId: wantCard.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Exchanged for ${wantCard.name}!`)
      setMyCard(null)
      setWantCard(null)
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-yellow-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-1">— CARD SWAP</p>
        <h1 className="font-display text-5xl tracking-wide text-white">EXCHANGE</h1>
        <p className="text-slate-400 text-sm mt-2">Swap a card from your collection for any card in the catalog. Balance covers the difference.</p>
      </div>

      {/* Exchange builder */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">

        {/* Your cards */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <h2 className="font-display text-xl tracking-wide text-white mb-4">YOUR CARD</h2>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={mySearch}
                onChange={e => setMySearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
            </div>
            <select
              value={myRarity}
              onChange={e => setMyRarity(e.target.value)}
              className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none"
            >
              {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {myCard && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-yellow-400/30 bg-yellow-400/5">
              <span className="text-xs text-yellow-400 font-mono">Selected:</span>
              <span className="text-sm text-white truncate">{myCard.card.name}</span>
              <button onClick={() => setMyCard(null)} className="ml-auto text-slate-500 hover:text-red-400">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filteredInventory.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">
                {inventory.length === 0 ? 'No cards in your collection.' : 'No matches.'}
              </p>
            ) : filteredInventory.map(uc => (
              <CardButton
                key={uc.id}
                card={uc.card}
                selected={myCard?.id === uc.id}
                onClick={() => setMyCard(myCard?.id === uc.id ? null : uc)}
              />
            ))}
          </div>
        </div>

        {/* Middle arrow + summary */}
        <div className="flex flex-col items-center gap-4 py-8 lg:pt-16">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ArrowLeftRight size={20} className="text-slate-400" />
          </div>

          {diff !== null && (
            <div className={`text-center px-4 py-2 rounded-xl text-sm font-mono ${
              diff > 0 ? 'bg-red-400/10 border border-red-400/20 text-red-400'
              : diff < 0 ? 'bg-green-400/10 border border-green-400/20 text-green-400'
              : 'bg-white/5 border border-white/10 text-slate-400'
            }`}>
              {diff > 0 ? `Pay ${formatCurrency(diff)}` : diff < 0 ? `Get ${formatCurrency(Math.abs(diff))}` : 'Even swap'}
            </div>
          )}

          <button
            onClick={handleExchange}
            disabled={!myCard || !wantCard || submitting || (diff !== null && diff > 0 && balance < diff)}
            className="btn-gold px-6 py-3 rounded-xl font-display tracking-wider flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <><ArrowLeftRight size={16} /> Exchange</>}
          </button>

          {diff !== null && diff > 0 && balance < diff && (
            <p className="text-xs text-red-400 text-center">Need {formatCurrency(diff - balance)} more</p>
          )}
        </div>

        {/* Catalog */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <h2 className="font-display text-xl tracking-wide text-white mb-4">GET THIS CARD</h2>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={wantSearch}
                onChange={e => setWantSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
            </div>
            <select
              value={wantRarity}
              onChange={e => setWantRarity(e.target.value)}
              className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none"
            >
              {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {wantCard && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-yellow-400/30 bg-yellow-400/5">
              <span className="text-xs text-yellow-400 font-mono">Selected:</span>
              <span className="text-sm text-white truncate">{wantCard.name}</span>
              <button onClick={() => setWantCard(null)} className="ml-auto text-slate-500 hover:text-red-400">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filteredCatalog.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No matches.</p>
            ) : filteredCatalog.map(card => (
              <CardButton
                key={card.id}
                card={card}
                selected={wantCard?.id === card.id}
                onClick={() => setWantCard(wantCard?.id === card.id ? null : card)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
