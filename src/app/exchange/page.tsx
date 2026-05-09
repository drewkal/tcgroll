// src/app/exchange/page.tsx
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { ArrowLeftRight, Search, Loader2, Check, X, Plus } from 'lucide-react'

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

function InventoryCardButton({ uc, selected, onClick }: {
  uc: UserCard
  selected: boolean
  onClick: () => void
}) {
  const color = getRarityColor(uc.card.rarity)
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
        {uc.card.imageUrl ? (
          <img src={uc.card.imageUrl} alt={uc.card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base" style={{ background: color + '15' }}>
            {GAME_EMOJI[uc.card.game] ?? '🃏'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{uc.card.name}</p>
        <p className="text-xs text-slate-400 truncate">{uc.card.rarity} · {uc.card.setName ?? uc.card.game}</p>
        <p className="text-xs font-mono mt-0.5" style={{ color }}>{formatCurrency(uc.card.value)}</p>
      </div>
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border transition-colors"
        style={{
          borderColor: selected ? color : 'rgba(255,255,255,0.15)',
          background: selected ? color : 'transparent',
        }}
      >
        {selected && <Check size={11} color="#000" strokeWidth={3} />}
      </div>
    </button>
  )
}

function CatalogCardButton({ card, selected, onClick }: {
  card: Card
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
        <p className="text-xs font-mono mt-0.5" style={{ color }}>{formatCurrency(card.value)}</p>
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

  // multi-select for offered cards
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // single select for wanted card
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
    return matchRarity && matchSearch
  }), [catalog, wantRarity, wantSearch])

  function toggleCard(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCards = inventory.filter(uc => selectedIds.has(uc.id))
  const offeredTotal = selectedCards.reduce((sum, uc) => sum + uc.card.value, 0)
  const diff = wantCard ? wantCard.value - offeredTotal : null
  const balance = session?.user?.balance ?? 0
  const canExchange = selectedIds.size > 0 && wantCard !== null && !(diff !== null && diff > 0 && balance < diff)

  async function handleExchange() {
    if (!canExchange || !wantCard) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardIds: Array.from(selectedIds), wantedCardId: wantCard.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Got ${wantCard.name}!`)
      setSelectedIds(new Set())
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
        <p className="text-slate-400 text-sm mt-2">
          Select one or more cards from your collection to trade for any single card in the catalog. Tokens cover the difference.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_1fr] gap-6 items-start">

        {/* YOUR CARDS — multi-select */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl tracking-wide text-white">YOUR CARDS</h2>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-lg">
                  {selectedIds.size} selected · {formatCurrency(offeredTotal)}
                </span>
                <button onClick={() => setSelectedIds(new Set())} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

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

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredInventory.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">
                {inventory.length === 0 ? 'No cards in your collection.' : 'No matches.'}
              </p>
            ) : filteredInventory.map(uc => (
              <InventoryCardButton
                key={uc.id}
                uc={uc}
                selected={selectedIds.has(uc.id)}
                onClick={() => toggleCard(uc.id)}
              />
            ))}
          </div>
        </div>

        {/* Middle panel */}
        <div className="flex flex-col items-center gap-4 py-4 lg:pt-20 lg:sticky lg:top-20">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ArrowLeftRight size={20} className="text-slate-400" />
          </div>

          {/* Value summary */}
          {selectedIds.size > 0 && (
            <div className="w-full text-center space-y-1 text-xs font-mono">
              <div className="text-slate-400">Offering</div>
              <div className="text-white">{formatCurrency(offeredTotal)}</div>
              {wantCard && (
                <>
                  <div className="text-slate-400 pt-1">Receiving</div>
                  <div className="text-white">{formatCurrency(wantCard.value)}</div>
                  <div className={`pt-2 px-3 py-1.5 rounded-lg ${
                    diff === 0 ? 'bg-white/5 text-slate-400'
                    : diff! > 0 ? 'bg-red-400/10 text-red-400'
                    : 'bg-green-400/10 text-green-400'
                  }`}>
                    {diff === 0 ? 'Even swap'
                      : diff! > 0 ? `Pay ${formatCurrency(diff!)}`
                      : `Get ${formatCurrency(Math.abs(diff!))}`}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleExchange}
            disabled={!canExchange || submitting}
            className="w-full btn-gold py-3 rounded-xl font-display tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <><ArrowLeftRight size={15} /> Exchange</>}
          </button>

          {diff !== null && diff > 0 && balance < diff && (
            <p className="text-xs text-red-400 text-center">Need {formatCurrency(diff - balance)} more</p>
          )}

          {selectedIds.size === 0 && (
            <p className="text-xs text-slate-600 text-center">Select cards on the left to start</p>
          )}
        </div>

        {/* CATALOG — single select */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl tracking-wide text-white">GET THIS CARD</h2>
            {wantCard && (
              <button onClick={() => setWantCard(null)} className="text-slate-500 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

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
              <span className="text-xs font-mono text-slate-400 ml-auto">{formatCurrency(wantCard.value)}</span>
            </div>
          )}

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredCatalog.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No matches.</p>
            ) : filteredCatalog.map(card => (
              <CatalogCardButton
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
