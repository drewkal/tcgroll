// src/app/open/[slug]/client.tsx
'use client'
import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card } from '@prisma/client'
import { CardDisplay } from '@/components/cards/card-display'
import { formatCurrency, getRarityLabel, getTierLabel } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Package, ChevronLeft, Zap, RotateCcw, ShoppingBag, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type CaseWithCards = {
  id: string
  name: string
  slug: string
  description?: string | null
  price: number
  tier: string
  cardCount: number
  caseCards: Array<{ card: Card; dropRate: number }>
  _count: { openings: number }
}

interface Props {
  cardCase: CaseWithCards
}

type Phase = 'idle' | 'opening' | 'revealing' | 'done'

export function CaseOpeningClient({ cardCase }: Props) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealedCards, setRevealedCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<boolean[]>([])
  const [selectedToSell, setSelectedToSell] = useState<Set<string>>(new Set())
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [isSelling, setIsSelling] = useState(false)
  const openingRef = useRef(false)

  const balance = currentBalance ?? session?.user?.balance ?? 0
  const canAfford = balance >= cardCase.price

  const handleOpen = useCallback(async () => {
    if (openingRef.current || phase !== 'idle') return
    if (!session) { router.push('/login'); return }
    if (!canAfford) { toast.error('Insufficient balance. Add funds in your profile.'); return }

    openingRef.current = true
    setPhase('opening')
    setRevealedCards([])
    setFlippedCards([])
    setSelectedToSell(new Set())

    try {
      const res = await fetch(`/api/cases/${cardCase.id}/open`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to open case')
        setPhase('idle')
        return
      }

      const cards: Card[] = data.cards
      setCurrentBalance(data.newBalance)
      setRevealedCards(cards)
      setFlippedCards(new Array(cards.length).fill(false))
      setPhase('revealing')

      // Flip cards one by one
      for (let i = 0; i < cards.length; i++) {
        await new Promise(r => setTimeout(r, 300 + i * 200))
        setFlippedCards(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
        // Play reveal sound based on rarity
        playRevealSound(cards[i].rarity)
      }

      setPhase('done')
      updateSession()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
      setPhase('idle')
    } finally {
      openingRef.current = false
    }
  }, [phase, session, canAfford, cardCase.id, router, updateSession])

  const toggleSell = useCallback((userCardId: string) => {
    setSelectedToSell(prev => {
      const next = new Set(prev)
      next.has(userCardId) ? next.delete(userCardId) : next.add(userCardId)
      return next
    })
  }, [])

  const handleSellSelected = async () => {
    if (selectedToSell.size === 0) return
    setIsSelling(true)
    try {
      // We need userCard IDs - for simplicity we'll sell all selected by card value
      // In a real implementation you'd track userCard IDs from the opening response
      const res = await fetch('/api/user/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardIds: Array.from(selectedToSell) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Sold ${data.soldCount} card${data.soldCount > 1 ? 's' : ''} for ${formatCurrency(data.totalValue)}!`)
      setCurrentBalance(b => (b ?? 0) + data.totalValue)
      setSelectedToSell(new Set())
      updateSession()
    } catch {
      toast.error('Failed to sell cards')
    } finally {
      setIsSelling(false)
    }
  }

  const bestCard = revealedCards.reduce<Card | null>((best, card) => {
    if (!best) return card
    const order = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']
    return order.indexOf(card.rarity) > order.indexOf(best.rarity) ? card : best
  }, null)

  // Drop rate breakdown for the info panel
  const rarityRates = cardCase.caseCards.reduce<Record<string, number>>((acc, cc) => {
    acc[cc.card.rarity] = (acc[cc.card.rarity] ?? 0) + cc.dropRate
    return acc
  }, {})

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">

      {/* Back nav */}
      <Link href="/cases" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} />
        Back to Cases
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Case Info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Case header */}
          <div className="glass rounded-2xl border border-white/5 p-6">
            <div className="text-xs font-mono text-yellow-400 tracking-widest mb-2">{getTierLabel(cardCase.tier)} CASE</div>
            <h1 className="font-display text-4xl tracking-wide text-white mb-2">{cardCase.name}</h1>
            {cardCase.description && (
              <p className="text-slate-400 text-sm leading-relaxed">{cardCase.description}</p>
            )}

            <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Cards per open</span>
                <span className="font-mono text-white">{cardCase.cardCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total opens</span>
                <span className="font-mono text-white">{cardCase._count.openings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Your balance</span>
                <span className={cn('font-mono font-bold', canAfford ? 'text-yellow-400' : 'text-red-400')}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Drop rates */}
          <div className="glass rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-4 text-sm font-mono text-slate-400">
              <Info size={14} />
              DROP RATES
            </div>
            <div className="space-y-2.5">
              {(['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'] as const).map(rarity => {
                const rate = rarityRates[rarity] ?? 0
                const color = getRarityColor(rarity)
                return (
                  <div key={rarity}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color }}>{getRarityLabel(rarity)}</span>
                      <span className="font-mono text-slate-400">{rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Open button */}
          <button
            onClick={handleOpen}
            disabled={phase === 'opening' || phase === 'revealing' || !canAfford}
            className={cn(
              'w-full py-5 rounded-2xl font-display text-2xl tracking-widest transition-all duration-300',
              'flex items-center justify-center gap-3',
              phase === 'idle' && canAfford
                ? 'btn-gold shadow-gold-glow hover:shadow-gold-glow animate-glow-pulse'
                : 'bg-navy-700 text-slate-500 cursor-not-allowed border border-white/5',
            )}
          >
            {phase === 'opening' || phase === 'revealing' ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ROLLING...
              </>
            ) : !canAfford ? (
              <>
                <Link href="/profile" className="text-sm text-slate-400">Add Funds in Profile</Link>
              </>
            ) : (
              <>
                <Zap size={24} className="fill-black" />
                OPEN — {formatCurrency(cardCase.price)}
              </>
            )}
          </button>

          {phase === 'done' && (
            <button
              onClick={() => setPhase('idle')}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Open Again
            </button>
          )}
        </div>

        {/* Right: Card reveal area */}
        <div className="lg:col-span-2">
          {phase === 'idle' && (
            <div className="h-full min-h-80 flex flex-col items-center justify-center glass rounded-2xl border border-white/5 border-dashed p-12">
              <Package size={64} className="text-slate-600 mb-4 animate-float" />
              <p className="font-display text-3xl text-slate-500 tracking-wide mb-2">READY TO ROLL</p>
              <p className="text-slate-600 text-sm">Click "Open" to reveal your cards</p>
            </div>
          )}

          {(phase === 'revealing' || phase === 'done') && revealedCards.length > 0 && (
            <div className="space-y-6">
              {/* Best pull highlight */}
              {phase === 'done' && bestCard && (bestCard.rarity === 'LEGENDARY' || bestCard.rarity === 'EPIC') && (
                <div
                  className={cn(
                    'rounded-2xl border p-4 flex items-center gap-4',
                    bestCard.rarity === 'LEGENDARY'
                      ? 'border-yellow-400/40 bg-yellow-400/5'
                      : 'border-purple-500/40 bg-purple-500/5',
                  )}
                >
                  <div className="text-2xl">{bestCard.rarity === 'LEGENDARY' ? '🏆' : '✨'}</div>
                  <div>
                    <div className="font-mono text-xs tracking-widest" style={{ color: getRarityColor(bestCard.rarity) }}>
                      {bestCard.rarity === 'LEGENDARY' ? '🎉 LEGENDARY PULL!' : '⭐ EPIC PULL!'}
                    </div>
                    <div className="font-display text-xl text-white">{bestCard.name}</div>
                    <div className="font-mono text-sm text-yellow-400">{formatCurrency(bestCard.value)}</div>
                  </div>
                </div>
              )}

              {/* Cards grid */}
              <div className={cn(
                'grid gap-4',
                revealedCards.length <= 5 ? 'grid-cols-5' : 'grid-cols-5',
              )}>
                {revealedCards.map((card, i) => (
                  <div
                    key={`${card.id}-${i}`}
                    className={cn(
                      'card-flip-container',
                      flippedCards[i] && 'flipped',
                    )}
                    style={{ height: '180px' }}
                  >
                    <div className="card-flip-inner">
                      {/* Back */}
                      <div className="card-face rounded-xl overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-b from-navy-700 to-navy-900 border-2 border-yellow-400/20 rounded-xl flex items-center justify-center">
                          <div className="text-4xl animate-pulse">🎴</div>
                        </div>
                      </div>
                      {/* Front */}
                      <div className="card-face card-back">
                        <CardDisplay card={card} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total value summary */}
              {phase === 'done' && (
                <div className="glass rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-500 tracking-widest">OPENING VALUE</div>
                      <div className="font-display text-3xl text-yellow-400">
                        {formatCurrency(revealedCards.reduce((s, c) => s + c.value, 0))}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Paid {formatCurrency(cardCase.price)} ·{' '}
                        {revealedCards.reduce((s, c) => s + c.value, 0) > cardCase.price
                          ? <span className="text-green-400">+{formatCurrency(revealedCards.reduce((s, c) => s + c.value, 0) - cardCase.price)} profit</span>
                          : <span className="text-red-400">{formatCurrency(revealedCards.reduce((s, c) => s + c.value, 0) - cardCase.price)}</span>
                        }
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href="/collection"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all"
                      >
                        <Package size={14} />
                        View Collection
                      </Link>
                      <button
                        onClick={() => setPhase('idle')}
                        className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                      >
                        <RotateCcw size={14} />
                        Open Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'opening' && (
            <div className="h-full min-h-80 flex flex-col items-center justify-center glass rounded-2xl border border-yellow-400/20 border-dashed p-12">
              <div className="text-6xl animate-spin-slow mb-6">⚡</div>
              <p className="font-display text-3xl text-yellow-400 text-glow-gold tracking-wide animate-pulse">
                ROLLING...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function playRevealSound(rarity: string) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const freqMap: Record<string, number[]> = {
      COMMON: [220, 280],
      UNCOMMON: [330, 440],
      RARE: [440, 660],
      EPIC: [550, 880, 1100],
      LEGENDARY: [660, 880, 1100, 1320],
    }
    const freqs = freqMap[rarity] ?? [330]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = rarity === 'LEGENDARY' ? 'sine' : 'triangle'
      gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3)
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.3)
    })
  } catch {}
}
