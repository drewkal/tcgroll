// src/app/exchange/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { ArrowLeftRight, Plus, X, ChevronRight, Search, Loader2, Check } from 'lucide-react'
import Image from 'next/image'

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
  obtainedAt: string
}

type Exchange = {
  id: string
  createdAt: string
  status: string
  offeringUser: { id: string; name: string | null; image: string | null }
  offeredCard: { id: string; card: Card }
  wantedCard: Card
}

const GAME_EMOJI: Record<string, string> = {
  POKEMON: '⚡', ONE_PIECE: '☠️', MAGIC: '✨', DRAGON_BALL: '🐉',
}

function CardChip({ card, onRemove }: { card: Card; onRemove?: () => void }) {
  const color = getRarityColor(card.rarity)
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: color + '40', background: color + '10' }}>
      <div className="w-8 h-10 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: color + '50' }}>
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base" style={{ background: color + '15' }}>
            {GAME_EMOJI[card.game] ?? '🃏'}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate max-w-36">{card.name}</p>
        <p className="text-xs font-mono" style={{ color }}>{formatCurrency(card.value)}</p>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 text-slate-500 hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

function ExchangeRow({ exchange, myId, inventory, onAccept, onCancel }: {
  exchange: Exchange
  myId: string
  inventory: UserCard[]
  onAccept: (exchangeId: string, userCardId: string) => Promise<void>
  onCancel: (exchangeId: string) => Promise<void>
}) {
  const isOwn = exchange.offeringUser.id === myId
  const color = getRarityColor(exchange.offeredCard.card.rarity)
  const wantedColor = getRarityColor(exchange.wantedCard.rarity)
  const diff = exchange.offeredCard.card.value - exchange.wantedCard.value
  const [accepting, setAccepting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const matchingCards = inventory.filter(uc => uc.cardId === exchange.wantedCard.id)

  async function handleAccept() {
    if (matchingCards.length === 0) return
    setAccepting(true)
    await onAccept(exchange.id, matchingCards[0].id)
    setAccepting(false)
  }

  async function handleCancel() {
    setCancelling(true)
    await onCancel(exchange.id)
    setCancelling(false)
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Offerer avatar */}
        <div className="flex items-center gap-2 min-w-0 mr-1">
          {exchange.offeringUser.image ? (
            <img src={exchange.offeringUser.image} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
              {exchange.offeringUser.name?.[0] ?? '?'}
            </div>
          )}
          <span className="text-xs text-slate-400 truncate max-w-20">{exchange.offeringUser.name ?? 'User'}</span>
        </div>

        {/* Offered card */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500">offers</span>
          <CardChip card={exchange.offeredCard.card} />
        </div>

        <ArrowLeftRight size={14} className="text-slate-500 flex-shrink-0" />

        {/* Wanted card */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-500">for</span>
          <CardChip card={exchange.wantedCard} />
        </div>

        {/* Value diff */}
        {diff !== 0 && (
          <div className={`text-xs font-mono px-2 py-1 rounded-lg ${diff > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {diff > 0 ? `you get +${formatCurrency(diff)}` : `you pay ${formatCurrency(Math.abs(diff))}`}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isOwn ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
            >
              {cancelling ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
            </button>
          ) : matchingCards.length > 0 ? (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="text-xs px-3 py-1.5 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {accepting ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> Accept</>}
            </button>
          ) : (
            <span className="text-xs text-slate-600 px-3 py-1.5">You don&apos;t have this card</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateOfferModal({ inventory, onClose, onCreated }: {
  inventory: UserCard[]
  onClose: () => void
  onCreated: () => void
}) {
  const [step, setStep] = useState<'offer' | 'want'>('offer')
  const [offeredCard, setOfferedCard] = useState<UserCard | null>(null)
  const [wantedCard, setWantedCard] = useState<Card | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Card[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/cards?search=${encodeURIComponent(search)}&limit=10`)
        if (res.ok) setSearchResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleSubmit() {
    if (!offeredCard || !wantedCard) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offeredCardId: offeredCard.id, wantedCardId: wantedCard.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Exchange offer created!')
      onCreated()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const diff = offeredCard && wantedCard ? offeredCard.card.value - wantedCard.value : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl tracking-wide text-white">CREATE OFFER</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {(['offer', 'want'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => { if (s === 'want' && !offeredCard) return; setStep(s) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${step === s ? 'bg-yellow-400 text-black' : 'bg-white/5 text-slate-400'}`}
            >
              {i + 1}. {s === 'offer' ? 'Your Card' : 'Want'}
            </button>
          ))}
        </div>

        {step === 'offer' ? (
          <div>
            <p className="text-sm text-slate-400 mb-3">Select a card from your inventory to offer:</p>
            {inventory.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No cards available to offer.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {inventory.map(uc => {
                  const color = getRarityColor(uc.card.rarity)
                  const isSelected = offeredCard?.id === uc.id
                  return (
                    <button
                      key={uc.id}
                      onClick={() => setOfferedCard(uc)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                      style={{
                        borderColor: isSelected ? color : 'rgba(255,255,255,0.08)',
                        background: isSelected ? color + '15' : 'transparent',
                      }}
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: color + '50' }}>
                        {uc.card.imageUrl ? (
                          <img src={uc.card.imageUrl} alt={uc.card.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: color + '15' }}>
                            {GAME_EMOJI[uc.card.game] ?? '🃏'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{uc.card.name}</p>
                        <p className="text-xs text-slate-400">{uc.card.rarity} · {uc.card.setName ?? uc.card.game}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color }}>{formatCurrency(uc.card.value)}</p>
                      </div>
                      {isSelected && <Check size={16} style={{ color }} className="flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
            {offeredCard && (
              <button
                onClick={() => setStep('want')}
                className="mt-4 w-full btn-gold py-3 rounded-xl font-display tracking-wider flex items-center justify-center gap-2"
              >
                Next: Choose What You Want <ChevronRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-400 mb-3">Search for a card you want:</p>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cards..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40"
              />
              {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 mb-4">
                {searchResults.map(card => {
                  const color = getRarityColor(card.rarity)
                  const isSelected = wantedCard?.id === card.id
                  return (
                    <button
                      key={card.id}
                      onClick={() => setWantedCard(card)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                      style={{
                        borderColor: isSelected ? color : 'rgba(255,255,255,0.08)',
                        background: isSelected ? color + '15' : 'transparent',
                      }}
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: color + '50' }}>
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: color + '15' }}>
                            {GAME_EMOJI[card.game] ?? '🃏'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{card.name}</p>
                        <p className="text-xs text-slate-400">{card.rarity} · {card.setName ?? card.game}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color }}>{formatCurrency(card.value)}</p>
                      </div>
                      {isSelected && <Check size={16} style={{ color }} className="flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {search.length > 0 && search.length < 2 && (
              <p className="text-xs text-slate-500 mb-4">Type at least 2 characters to search.</p>
            )}

            {/* Summary */}
            {offeredCard && wantedCard && (
              <div className="rounded-xl border border-white/10 p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">You offer:</span>
                  <CardChip card={offeredCard.card} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">You want:</span>
                  <CardChip card={wantedCard} />
                </div>
                {diff !== null && diff !== 0 && (
                  <p className={`text-xs font-mono ${diff > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    {diff > 0
                      ? `Accepter will receive +${formatCurrency(diff)} balance`
                      : `Accepter will pay ${formatCurrency(Math.abs(diff))} balance`}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep('offer')} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!wantedCard || submitting}
                className="flex-1 btn-gold py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Post Offer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExchangePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [inventory, setInventory] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'browse' | 'mine'>('browse')
  const [showCreate, setShowCreate] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/exchange')
      if (res.ok) {
        const data = await res.json()
        setExchanges(data.exchanges)
        setInventory(data.inventory)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') fetchData()
  }, [status, router, fetchData])

  async function handleAccept(exchangeId: string, userCardId: string) {
    const res = await fetch(`/api/exchange/${exchangeId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acceptedCardId: userCardId }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Exchange completed!')
    fetchData()
  }

  async function handleCancel(exchangeId: string) {
    const res = await fetch(`/api/exchange/${exchangeId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Offer cancelled')
    fetchData()
  }

  const myId = session?.user?.id ?? ''
  const myExchanges = exchanges.filter(e => e.offeringUser.id === myId)
  const otherExchanges = exchanges.filter(e => e.offeringUser.id !== myId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-yellow-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      {showCreate && (
        <CreateOfferModal
          inventory={inventory}
          onClose={() => setShowCreate(false)}
          onCreated={fetchData}
        />
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-yellow-400 font-mono text-sm tracking-widest mb-1">— P2P TRADING</p>
          <h1 className="font-display text-5xl tracking-wide text-white">EXCHANGE</h1>
          <p className="text-slate-400 text-sm mt-2">Trade cards with other players. Balance covers any value difference.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gold px-5 py-3 rounded-xl font-display tracking-wider flex items-center gap-2"
        >
          <Plus size={16} /> New Offer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('browse')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'browse' ? 'bg-yellow-400 text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}
        >
          Browse Offers {otherExchanges.length > 0 && `(${otherExchanges.length})`}
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'mine' ? 'bg-yellow-400 text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}
        >
          My Offers {myExchanges.length > 0 && `(${myExchanges.length})`}
        </button>
      </div>

      {/* Content */}
      {tab === 'browse' ? (
        otherExchanges.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <ArrowLeftRight size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-display text-2xl mb-2">No offers yet</p>
            <p className="text-sm">Be the first to post a trade offer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherExchanges.map(ex => (
              <ExchangeRow
                key={ex.id}
                exchange={ex}
                myId={myId}
                inventory={inventory}
                onAccept={handleAccept}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )
      ) : (
        myExchanges.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <ArrowLeftRight size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-display text-2xl mb-2">No active offers</p>
            <p className="text-sm">Create an offer to start trading.</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 btn-gold px-6 py-2.5 rounded-xl font-display tracking-wider">
              Create Offer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myExchanges.map(ex => (
              <ExchangeRow
                key={ex.id}
                exchange={ex}
                myId={myId}
                inventory={inventory}
                onAccept={handleAccept}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}
