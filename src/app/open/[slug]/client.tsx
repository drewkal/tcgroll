// src/app/open/[slug]/client.tsx
'use client'
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card } from '@prisma/client'
import { CardDisplay } from '@/components/cards/card-display'
import { formatCurrency, getRarityLabel, getTierLabel } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Package, ChevronLeft, Zap, RotateCcw, Info } from 'lucide-react'
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

interface Props { cardCase: CaseWithCards }

type Phase = 'idle' | 'fetching' | 'spinning' | 'done'

// ─── Reel constants ────────────────────────────────────────────────
const CARD_W    = 82
const CARD_H    = 116
const CARD_GAP  = 6
const CARD_SLOT = CARD_W + CARD_GAP
const STRIP_LEN = 58
const WIN_IDX   = 50   // winner lands at this index in the strip

function buildStrip(caseCards: CaseWithCards['caseCards'], winner: Card): Card[] {
  // weighted pool
  const pool: Card[] = []
  for (const { card, dropRate } of caseCards) {
    const n = Math.max(1, Math.round(dropRate))
    for (let i = 0; i < n; i++) pool.push(card)
  }
  const pick = () => pool[Math.floor(Math.random() * pool.length)]
  return Array.from({ length: STRIP_LEN }, (_, i) => (i === WIN_IDX ? winner : pick()))
}

// ─── Single card in the reel ───────────────────────────────────────
function ReelCard({ card, highlight }: { card: Card; highlight: boolean }) {
  const color = getRarityColor(card.rarity)
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        flexShrink: 0,
        borderRadius: 10,
        border: `2px solid ${highlight ? '#fbbf24' : color + '55'}`,
        background: `linear-gradient(160deg, ${color}22 0%, #0a0f1e 70%)`,
        boxShadow: highlight ? `0 0 28px ${color}, 0 0 56px ${color}55` : undefined,
        overflow: 'hidden',
        transition: 'box-shadow 0.5s, border-color 0.5s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        gap: 4,
      }}
    >
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: color + '33', border: `1px solid ${color}66` }} />
          <span style={{ color, fontSize: 9, fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0.3 }}>
            {card.name.length > 14 ? card.name.slice(0, 13) + '…' : card.name}
          </span>
          <span style={{ color: color + 'bb', fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>
            {card.rarity.slice(0, 3)}
          </span>
        </>
      )}
    </div>
  )
}

// ─── The spinning reel for one card ───────────────────────────────
function SpinReel({
  caseCards,
  winner,
  onComplete,
}: {
  caseCards: CaseWithCards['caseCards']
  winner: Card
  onComplete: () => void
}) {
  const strip        = useMemo(() => buildStrip(caseCards, winner), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const doneRef      = useRef(false)
  const [tx, setTx]           = useState(0)
  const [started, setStarted] = useState(false)
  const [landed, setLanded]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const w = containerRef.current?.offsetWidth ?? 700
      // put WIN_IDX card in center of container
      setTx(-(WIN_IDX * CARD_SLOT - w / 2 + CARD_W / 2))
      setStarted(true)
    }, 60)
    return () => clearTimeout(t)
  }, [])

  const onEnd = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setLanded(true)
    playRevealSound(winner.rarity)
    setTimeout(onComplete, 1100)
  }, [winner.rarity, onComplete])

  return (
    <div className="relative select-none" style={{ paddingTop: 14, paddingBottom: 14 }}>
      {/* Arrow markers */}
      <div className="absolute top-0 left-1/2 z-20 pointer-events-none"
        style={{ transform: 'translateX(-50%)', width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
          borderTop: '12px solid #fbbf24' }} />
      <div className="absolute bottom-0 left-1/2 z-20 pointer-events-none"
        style={{ transform: 'translateX(-50%)', width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
          borderBottom: '12px solid #fbbf24' }} />

      <div ref={containerRef} className="overflow-hidden relative" style={{ height: CARD_H + 4 }}>
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{ width: 100, background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
        <div className="absolute inset-y-0 right-0 z-10 pointer-events-none"
          style={{ width: 100, background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />

        {/* Selection box */}
        <div className="absolute inset-y-0 left-1/2 z-10 pointer-events-none"
          style={{ transform: 'translateX(-50%)', width: CARD_W + 4,
            border: '2px solid rgba(251,191,36,0.55)', borderRadius: 12,
            boxShadow: '0 0 12px rgba(251,191,36,0.2)' }} />

        {/* Strip */}
        <div
          style={{
            display: 'flex',
            gap: CARD_GAP,
            paddingTop: 2,
            transform: `translateX(${tx}px)`,
            transition: started ? 'transform 4.8s cubic-bezier(0.06, 0.8, 0.2, 1)' : 'none',
            willChange: 'transform',
          }}
          onTransitionEnd={onEnd}
        >
          {strip.map((card, i) => (
            <ReelCard key={i} card={card} highlight={landed && i === WIN_IDX} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────
export function CaseOpeningClient({ cardCase }: Props) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const openingRef = useRef(false)

  const [phase,          setPhase]          = useState<Phase>('idle')
  const [winningCards,   setWinningCards]   = useState<Card[]>([])
  const [revealedCards,  setRevealedCards]  = useState<Card[]>([])
  const [spinIndex,      setSpinIndex]      = useState(0)
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [selectedToSell, setSelectedToSell] = useState<Set<string>>(new Set())
  const [isSelling,      setIsSelling]      = useState(false)

  const balance   = currentBalance ?? session?.user?.balance ?? 0
  const canAfford = balance >= cardCase.price

  const handleOpen = useCallback(async () => {
    if (openingRef.current || phase !== 'idle') return
    if (!session) { router.push('/login'); return }
    if (!canAfford) { toast.error('Insufficient balance. Add funds in your profile.'); return }

    openingRef.current = true
    setPhase('fetching')
    setWinningCards([])
    setRevealedCards([])
    setSpinIndex(0)
    setSelectedToSell(new Set())

    try {
      const res  = await fetch(`/api/cases/${cardCase.id}/open`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to open case'); setPhase('idle'); return }
      setWinningCards(data.cards)
      setCurrentBalance(data.newBalance)
      setPhase('spinning')
    } catch {
      toast.error('Something went wrong')
      setPhase('idle')
    } finally {
      openingRef.current = false
    }
  }, [phase, session, canAfford, cardCase.id, router])

  const handleSpinComplete = useCallback(() => {
    setRevealedCards(prev => [...prev, winningCards[spinIndex]])
    const next = spinIndex + 1
    if (next >= winningCards.length) {
      setTimeout(() => { setPhase('done'); updateSession() }, 150)
    } else {
      setSpinIndex(next)
    }
  }, [spinIndex, winningCards, updateSession])

  const toggleSell = useCallback((id: string) => {
    setSelectedToSell(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }, [])

  const handleSellSelected = async () => {
    if (selectedToSell.size === 0) return
    setIsSelling(true)
    try {
      const res  = await fetch('/api/user/sell', {
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

  const rarityRates = cardCase.caseCards.reduce<Record<string, number>>((acc, cc) => {
    acc[cc.card.rarity] = (acc[cc.card.rarity] ?? 0) + cc.dropRate
    return acc
  }, {})

  const totalValue = revealedCards.reduce((s, c) => s + c.value, 0)

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Link href="/cases" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> Back to Cases
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left panel ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          <div className="glass rounded-2xl border border-white/5 p-6">
            <div className="text-xs font-mono text-yellow-400 tracking-widest mb-2">{getTierLabel(cardCase.tier)} CASE</div>
            <h1 className="font-display text-4xl tracking-wide text-white mb-2">{cardCase.name}</h1>
            {cardCase.description && <p className="text-slate-400 text-sm leading-relaxed">{cardCase.description}</p>}
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

          <div className="glass rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-4 text-sm font-mono text-slate-400">
              <Info size={14} /> DROP RATES
            </div>
            <div className="space-y-2.5">
              {(['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'] as const).map(rarity => {
                const rate  = rarityRates[rarity] ?? 0
                const color = getRarityColor(rarity)
                return (
                  <div key={rarity}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color }}>{getRarityLabel(rarity)}</span>
                      <span className="font-mono text-slate-400">{rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {(phase === 'fetching' || phase === 'spinning') && (
            <div className="w-full py-4 rounded-2xl bg-navy-700 border border-white/5 flex items-center justify-center gap-3 text-slate-400 font-display tracking-widest text-lg">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              {phase === 'fetching' ? 'ROLLING...' : 'SPINNING...'}
            </div>
          )}

          {phase === 'done' && (
            <button
              onClick={() => { setPhase('idle'); setRevealedCards([]); setWinningCards([]); setSpinIndex(0) }}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Open Again
            </button>
          )}
        </div>

        {/* ── Right panel ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Idle — show all cards in the case */}
          {phase === 'idle' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-mono text-slate-500 tracking-widest mb-3">
                  {cardCase.caseCards.length} POSSIBLE CARDS
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {cardCase.caseCards.map(({ card, dropRate }) => (
                    <div key={card.id}>
                      <CardDisplay card={card} size="sm" />
                      <div className="text-center text-xs font-mono text-slate-500 mt-1">{dropRate.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpen}
                disabled={!canAfford}
                className={cn(
                  'w-full py-5 rounded-2xl font-display text-2xl tracking-widest transition-all duration-300',
                  'flex items-center justify-center gap-3',
                  canAfford
                    ? 'btn-gold shadow-gold-glow hover:shadow-gold-glow animate-glow-pulse'
                    : 'bg-navy-700 text-slate-500 cursor-not-allowed border border-white/5',
                )}
              >
                {canAfford
                  ? <><Zap size={24} className="fill-black" /> OPEN — {formatCurrency(cardCase.price)}</>
                  : <Link href="/profile" className="text-sm text-slate-400">Add Funds in Profile</Link>
                }
              </button>
            </div>
          )}

          {/* Fetching */}
          {phase === 'fetching' && (
            <div className="min-h-80 flex flex-col items-center justify-center glass rounded-2xl border border-yellow-400/20 p-12">
              <div className="text-5xl animate-spin-slow mb-5">⚡</div>
              <p className="font-display text-3xl text-yellow-400 text-glow-gold tracking-wide animate-pulse">ROLLING...</p>
            </div>
          )}

          {/* Spinning + already revealed */}
          {phase === 'spinning' && winningCards.length > 0 && (
            <>
              {/* Progress */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono text-slate-500 tracking-widest">
                  CARD {spinIndex + 1} OF {winningCards.length}
                </span>
                <div className="flex gap-1.5">
                  {winningCards.map((_, i) => (
                    <div key={i} className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i < spinIndex ? 'bg-yellow-400' : i === spinIndex ? 'bg-yellow-400 animate-pulse scale-125' : 'bg-white/10'
                    )} />
                  ))}
                </div>
              </div>

              {/* Reel */}
              <div className="glass rounded-2xl border border-yellow-400/20 p-4 overflow-hidden">
                <SpinReel
                  key={spinIndex}
                  caseCards={cardCase.caseCards}
                  winner={winningCards[spinIndex]}
                  onComplete={handleSpinComplete}
                />
              </div>

              {/* Previously revealed cards */}
              {revealedCards.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-slate-500 tracking-widest mb-3">REVEALED SO FAR</p>
                  <div className="grid grid-cols-5 gap-3">
                    {revealedCards.map((card, i) => (
                      <div key={i} className="opacity-80">
                        <CardDisplay card={card} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Done */}
          {phase === 'done' && revealedCards.length > 0 && (
            <>
              {/* Best pull banner */}
              {bestCard && (bestCard.rarity === 'LEGENDARY' || bestCard.rarity === 'EPIC') && (
                <div className={cn(
                  'rounded-2xl border p-4 flex items-center gap-4',
                  bestCard.rarity === 'LEGENDARY' ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-purple-500/40 bg-purple-500/5',
                )}>
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
              <div className="grid grid-cols-5 gap-3">
                {revealedCards.map((card, i) => (
                  <div
                    key={`${card.id}-${i}`}
                    onClick={() => toggleSell(card.id)}
                    className={cn(
                      'cursor-pointer rounded-xl transition-all',
                      selectedToSell.has(card.id) ? 'ring-2 ring-red-400 opacity-60' : 'hover:scale-105',
                    )}
                  >
                    <CardDisplay card={card} size="sm" />
                    {selectedToSell.has(card.id) && (
                      <div className="text-center text-xs font-mono text-red-400 mt-1">SELL</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="glass rounded-2xl border border-white/5 p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs font-mono text-slate-500 tracking-widest">OPENING VALUE</div>
                    <div className="font-display text-3xl text-yellow-400">{formatCurrency(totalValue)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Paid {formatCurrency(cardCase.price)} ·{' '}
                      {totalValue > cardCase.price
                        ? <span className="text-green-400">+{formatCurrency(totalValue - cardCase.price)} profit</span>
                        : <span className="text-red-400">{formatCurrency(totalValue - cardCase.price)}</span>
                      }
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedToSell.size > 0 && (
                      <button
                        onClick={handleSellSelected}
                        disabled={isSelling}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm transition-all disabled:opacity-50"
                      >
                        {isSelling ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : null}
                        Sell {selectedToSell.size} card{selectedToSell.size > 1 ? 's' : ''}
                      </button>
                    )}
                    <Link
                      href="/collection"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all"
                    >
                      <Package size={14} /> Collection
                    </Link>
                    <button
                      onClick={() => { setPhase('idle'); setRevealedCards([]); setWinningCards([]); setSpinIndex(0) }}
                      className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    >
                      <RotateCcw size={14} /> Open Again
                    </button>
                  </div>
                </div>
              </div>
            </>
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
      COMMON:    [220, 280],
      UNCOMMON:  [330, 440],
      RARE:      [440, 660],
      EPIC:      [550, 880, 1100],
      LEGENDARY: [660, 880, 1100, 1320],
    }
    const freqs = freqMap[rarity] ?? [330]
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = rarity === 'LEGENDARY' ? 'sine' : 'triangle'
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + i * 0.08 + 0.35)
    })
  } catch {}
}
