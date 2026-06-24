// src/app/open/[slug]/client.tsx
'use client'
import { useState, useCallback, useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card } from '@prisma/client'
import { CardDisplay } from '@/components/cards/card-display'
import { formatCurrency, getRarityLabel, getTierLabel } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Package, ChevronLeft, Zap, RotateCcw, Info, DollarSign, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LowBalanceModal } from '@/components/low-balance-modal'

function fmtRate(rate: number): string {
  if (rate >= 1)   return rate.toFixed(2) + '%'
  if (rate >= 0.1) return rate.toFixed(3) + '%'
  return rate.toFixed(4) + '%'
}

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

type RecentPull = {
  id: string
  card: { name: string; rarity: string; value: number; imageUrl: string | null }
  opening: { createdAt: string; user: { name: string | null } }
}

interface Props {
  cardCase: CaseWithCards
  recentPulls: RecentPull[]
}

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

// ─── Spin tick sounds ─────────────────────────────────────────────
function scheduleSpinTicks(): (() => void) {
  if (typeof window === 'undefined') return () => {}
  const ids: ReturnType<typeof setTimeout>[] = []
  let t = 0
  let interval = 55
  while (t < 4750) {
    const delay = t
    const vol = interval < 80 ? 0.07 : interval < 200 ? 0.05 : 0.03
    ids.push(setTimeout(() => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'square'
        osc.frequency.value = 900 + Math.random() * 100
        g.gain.setValueAtTime(vol, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.025)
      } catch {}
    }, delay))
    interval = Math.min(500, interval * 1.085)
    t += interval
  }
  return () => ids.forEach(clearTimeout)
}

// ─── Confetti celebration ─────────────────────────────────────────
function Celebration({ rarity }: { rarity: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const color = rarity === 'LEGENDARY' ? '#f59e0b' : '#a855f7'
  const secondary = rarity === 'LEGENDARY' ? '#fff7ed' : '#ede9fe'

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!

    type Particle = {
      x: number; y: number; vx: number; vy: number
      size: number; rot: number; rotV: number; color: string; shape: 'rect' | 'circle'
    }

    const palette = [color, secondary, '#ffffff', color, color]
    const particles: Particle[] = Array.from({ length: rarity === 'LEGENDARY' ? 140 : 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 4 + 2,
      size: Math.random() * 7 + 3,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }))

    const start = Date.now()
    const DURATION = 3200

    let raf: number
    const draw = () => {
      const elapsed = Date.now() - start
      const fade = Math.max(0, 1 - elapsed / DURATION)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.08
        p.rot += p.rotV
        ctx.save()
        ctx.globalAlpha = fade * 0.9
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }

      if (elapsed < DURATION) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [color, secondary, rarity])

  return <canvas ref={canvasRef} className="fixed inset-0 z-40 pointer-events-none" />
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
  const cancelTicks  = useRef<(() => void) | null>(null)
  const [tx, setTx]           = useState(0)
  const [started, setStarted] = useState(false)
  const [landed, setLanded]   = useState(false)
  const [flash, setFlash]     = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const w = containerRef.current?.offsetWidth ?? 700
      setTx(-(WIN_IDX * CARD_SLOT - w / 2 + CARD_W / 2))
      setStarted(true)
      cancelTicks.current = scheduleSpinTicks()
    }, 60)
    return () => { clearTimeout(t); cancelTicks.current?.() }
  }, [])

  const isBig = winner.rarity === 'LEGENDARY' || winner.rarity === 'EPIC'

  const onEnd = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    cancelTicks.current?.()
    setLanded(true)
    if (isBig) setFlash(true)
    playRevealSound(winner.rarity)
    setTimeout(onComplete, isBig ? 1800 : 1100)
  }, [winner.rarity, onComplete, isBig])

  const rarityColor = getRarityColor(winner.rarity)

  return (
    <>
    {/* Screen flash */}
    {flash && (
      <div
        className="fixed inset-0 z-30 pointer-events-none animate-ping-once"
        style={{ backgroundColor: rarityColor + '30' }}
      />
    )}
    {/* Confetti */}
    {flash && <Celebration rarity={winner.rarity} />}

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
    </>
  )
}

// ─── Main component ────────────────────────────────────────────────
export function CaseOpeningClient({ cardCase, recentPulls }: Props) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const openingRef = useRef(false)

  const [phase,          setPhase]          = useState<Phase>('idle')
  const [winningCards,   setWinningCards]   = useState<Card[]>([])
  const [revealedCards,  setRevealedCards]  = useState<Card[]>([])
  const [userCardIds,    setUserCardIds]    = useState<string[]>([])
  const [spinIndex,      setSpinIndex]      = useState(0)
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [selectedToSell, setSelectedToSell] = useState<Set<number>>(new Set())
  const [isSelling,      setIsSelling]      = useState(false)
  const [revealingCard,  setRevealingCard]  = useState<Card | null>(null)
  const [revealExiting,  setRevealExiting]  = useState(false)
  const [showLowBalance, setShowLowBalance] = useState(false)
  const [isDemo,         setIsDemo]         = useState(false)

  const balance   = currentBalance ?? session?.user?.balance ?? 0
  const canAfford = balance >= cardCase.price

  useEffect(() => {
    if (phase === 'done' && !canAfford) {
      const t = setTimeout(() => setShowLowBalance(true), 1500)
      return () => clearTimeout(t)
    }
  }, [phase, canAfford])

  const handleOpen = useCallback(async () => {
    if (openingRef.current || phase !== 'idle') return

    // Guest demo — pick a winner client-side, skip the API
    if (!session) {
      const pool: Card[] = []
      for (const { card, dropRate } of cardCase.caseCards) {
        const n = Math.max(1, Math.round(dropRate))
        for (let i = 0; i < n; i++) pool.push(card)
      }
      const winner = pool[Math.floor(Math.random() * pool.length)]
      setIsDemo(true)
      setWinningCards([winner])
      setUserCardIds([])
      setRevealedCards([])
      setSpinIndex(0)
      setSelectedToSell(new Set())
      setPhase('spinning')
      return
    }

    if (!canAfford) { toast.error('Insufficient balance. Add funds in your profile.'); return }

    openingRef.current = true
    setPhase('fetching')
    setWinningCards([])
    setRevealedCards([])
    setUserCardIds([])
    setSpinIndex(0)
    setSelectedToSell(new Set())

    try {
      const res  = await fetch(`/api/cases/${cardCase.id}/open`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to open case'); setPhase('idle'); return }
      setWinningCards(data.cards)
      setUserCardIds(data.userCardIds ?? [])
      setCurrentBalance(data.newBalance)
      updateSession()
      setPhase('spinning')
    } catch {
      toast.error('Something went wrong')
      setPhase('idle')
    } finally {
      openingRef.current = false
    }
  }, [phase, session, canAfford, cardCase.id, router])

  const handleSpinComplete = useCallback(() => {
    const card = winningCards[spinIndex]
    setRevealingCard(card)
    setRevealExiting(false)
    const revealMs = (card.rarity === 'LEGENDARY' || card.rarity === 'EPIC') ? 3000 : 2000
    setTimeout(() => {
      // Fade out the reveal card first
      setRevealExiting(true)
      setTimeout(() => {
        setRevealingCard(null)
        setRevealExiting(false)
        setRevealedCards(prev => [...prev, card])
        const next = spinIndex + 1
        if (next >= winningCards.length) {
          setTimeout(() => setPhase('done'), 150)
        } else {
          setSpinIndex(next)
        }
      }, 350)
    }, revealMs)
  }, [spinIndex, winningCards])

  const toggleSell = useCallback((idx: number) => {
    setSelectedToSell(prev => {
      const s = new Set(prev)
      s.has(idx) ? s.delete(idx) : s.add(idx)
      return s
    })
  }, [])

  const sellCards = async (ids: string[]) => {
    if (ids.length === 0) return
    setIsSelling(true)
    try {
      const res  = await fetch('/api/user/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardIds: ids }),
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

  const handleSellSelected = () => sellCards(Array.from(selectedToSell).map(i => userCardIds[i]).filter(Boolean))
  const handleSellAll      = () => sellCards(userCardIds)

  const bestCard = revealedCards.reduce<Card | null>((best, card) => {
    if (!best) return card
    const order = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']
    return order.indexOf(card.rarity) > order.indexOf(best.rarity) ? card : best
  }, null)

  const handleShare = useCallback(async () => {
    const url = `https://tcgroll.com/open/${cardCase.slug}?utm_source=share&utm_medium=social&utm_campaign=pull_share`
    const pullLabel = bestCard
      ? `I just pulled ${bestCard.name}${bestCard.rarity === 'LEGENDARY' ? ' 🏆' : bestCard.rarity === 'EPIC' ? ' ✨' : ''} from the ${cardCase.name} case on TCGRoll!`
      : `I just opened the ${cardCase.name} case on TCGRoll!`
    const text = `${pullLabel}\n\nOpen your own case 🎴`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'TCGRoll Pull', text, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      toast.success('Copied to clipboard!')
    }
  }, [cardCase.slug, cardCase.name, bestCard])

  const rarityRates = cardCase.caseCards.reduce<Record<string, number>>((acc, cc) => {
    acc[cc.card.rarity] = (acc[cc.card.rarity] ?? 0) + cc.dropRate
    return acc
  }, {})

  const totalValue = revealedCards.reduce((s, c) => s + c.value, 0)

  return (
    <>
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <Link href="/cases" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> Back to Cases
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left panel ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5 order-2 lg:order-1">
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
              {session && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Your balance</span>
                  <span className={cn('font-mono font-bold', canAfford ? 'text-yellow-400' : 'text-red-400')}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              )}
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
                      <span className="font-mono text-slate-400">{fmtRate(rate)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent pulls feed */}
          {recentPulls.length > 0 && (
            <div className="glass rounded-2xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-slate-400 tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                RECENT PULLS
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {recentPulls.map(pull => {
                  const color = getRarityColor(pull.card.rarity)
                  const name  = pull.opening.user.name
                  const label = name ? name.split(' ')[0] + (name.split(' ')[1] ? ' ' + name.split(' ')[1][0] + '.' : '') : 'Someone'
                  const ago   = timeAgo(pull.opening.createdAt)
                  return (
                    <div key={pull.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/3 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-slate-400 text-xs truncate flex-1 min-w-0">
                        <span className="text-white">{label}</span>
                        {' pulled '}
                        <span style={{ color }} className="font-medium">{pull.card.name}</span>
                      </span>
                      <span className="text-xs font-mono text-slate-600 flex-shrink-0">{ago}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(phase === 'fetching' || phase === 'spinning') && (
            <div className="w-full py-4 rounded-2xl bg-navy-700 border border-white/5 flex items-center justify-center gap-3 text-slate-400 font-display tracking-widest text-lg">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              {phase === 'fetching' ? 'ROLLING...' : 'SPINNING...'}
            </div>
          )}

          {phase === 'done' && (
            <button
              onClick={() => { setPhase('idle'); setRevealedCards([]); setWinningCards([]); setUserCardIds([]); setSpinIndex(0); setSelectedToSell(new Set()); setIsDemo(false) }}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-mono text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> {isDemo ? 'Try Again' : 'Open Again'}
            </button>
          )}
        </div>

        {/* ── Right panel ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">

          {/* Idle — show all cards in the case */}
          {phase === 'idle' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-mono text-slate-500 tracking-widest mb-3">
                  {cardCase.caseCards.length} POSSIBLE CARDS
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {cardCase.caseCards.map(({ card, dropRate }) => (
                    <div key={card.id}>
                      <CardDisplay card={card} size="md" />
                      <div className="text-center text-xs font-mono text-slate-500 mt-1">{fmtRate(dropRate)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpen}
                disabled={!!session && !canAfford}
                className={cn(
                  'w-full py-5 rounded-2xl font-display text-2xl tracking-widest transition-all duration-300',
                  'flex items-center justify-center gap-3',
                  (!session || canAfford)
                    ? 'btn-gold shadow-gold-glow hover:shadow-gold-glow animate-glow-pulse'
                    : 'bg-navy-700 text-slate-500 cursor-not-allowed border border-white/5',
                )}
              >
                {!session
                  ? <><Zap size={24} className="fill-black" /> TRY FREE ROLL</>
                  : canAfford
                    ? <><Zap size={24} className="fill-black" /> OPEN — {formatCurrency(cardCase.price)}</>
                    : <Link href="/profile" className="text-sm text-slate-400">Add Funds in Profile</Link>
                }
              </button>
              {!session && (
                <p className="text-center text-xs text-slate-500 font-mono -mt-2">
                  No account needed · <Link href="/register" className="text-yellow-400 hover:underline">Sign up free</Link> to play for real
                </p>
              )}
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

              {/* Big card reveal OR reel */}
              {revealingCard ? (
                <>
                  {(revealingCard.rarity === 'LEGENDARY' || revealingCard.rarity === 'EPIC') && (
                    <Celebration rarity={revealingCard.rarity} />
                  )}
                  <div
                    className="glass rounded-2xl border flex flex-col items-center justify-center py-10 gap-5 animate-card-reveal"
                    style={{
                      borderColor: getRarityColor(revealingCard.rarity) + '60',
                      background: `radial-gradient(ellipse at center, ${getRarityColor(revealingCard.rarity)}12 0%, transparent 70%)`,
                      transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
                      opacity: revealExiting ? 0 : 1,
                      transform: revealExiting ? 'scale(0.94) translateY(16px)' : 'scale(1) translateY(0)',
                    }}
                  >
                    <CardDisplay card={revealingCard} size="xl" />
                    <div className="text-center">
                      <div
                        className="font-display text-3xl tracking-widest"
                        style={{ color: getRarityColor(revealingCard.rarity), textShadow: `0 0 20px ${getRarityColor(revealingCard.rarity)}` }}
                      >
                        {revealingCard.rarity === 'LEGENDARY' ? '🏆 LEGENDARY!' :
                         revealingCard.rarity === 'EPIC'      ? '✨ EPIC PULL!'  :
                         revealingCard.rarity === 'RARE'      ? '⭐ RARE PULL'   :
                         revealingCard.name}
                      </div>
                      <div className="font-mono text-xl text-yellow-400 mt-1">{formatCurrency(revealingCard.value)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl border border-yellow-400/20 p-4 overflow-hidden animate-fade-in">
                  <SpinReel
                    key={spinIndex}
                    caseCards={cardCase.caseCards}
                    winner={winningCards[spinIndex]}
                    onComplete={handleSpinComplete}
                  />
                </div>
              )}

              {/* Previously revealed cards */}
              {revealedCards.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-slate-500 tracking-widest mb-3">REVEALED SO FAR</p>
                  <div className="flex flex-wrap gap-3">
                    {revealedCards.map((card, i) => (
                      <div key={i} className="opacity-80">
                        <CardDisplay card={card} size="md" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Done */}
          {phase === 'done' && revealedCards.length > 0 && (
            <div className="animate-fade-in space-y-6">
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
              <div className={cn('grid gap-3', revealedCards.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5')}>
                {revealedCards.map((card, i) => (
                  <div
                    key={`${card.id}-${i}`}
                    onClick={() => toggleSell(i)}
                    className={cn(
                      'cursor-pointer rounded-xl transition-all',
                      selectedToSell.has(i) ? 'ring-2 ring-red-400 opacity-60' : 'hover:scale-105',
                    )}
                  >
                    <CardDisplay card={card} size={revealedCards.length <= 4 ? 'lg' : 'md'} />
                    {selectedToSell.has(i) && (
                      <div className="text-center text-xs font-mono text-red-400 mt-1">SELL</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary + actions */}
              {isDemo ? (
                <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5 text-center space-y-3">
                  <div className="text-xs font-mono text-slate-500 tracking-widest">DEMO ROLL — NOT SAVED</div>
                  <div className="font-display text-xl text-white tracking-wide">Play for real cards</div>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Create a free account and get{' '}
                    <span className="text-yellow-400 font-semibold">🪙 500 bonus tokens</span>.
                    Open real cases — win physical cards shipped to your door.
                  </p>
                  <Link
                    href="/register"
                    className="btn-gold inline-flex items-center gap-2 px-7 py-3 rounded-xl font-display tracking-widest shadow-gold-glow"
                  >
                    <Zap size={16} className="fill-black" />
                    Claim 500 Free Tokens
                  </Link>
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      onClick={() => { setPhase('idle'); setRevealedCards([]); setWinningCards([]); setSpinIndex(0); setIsDemo(false) }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={11} /> Roll again
                    </button>
                    <Link href="/login" className="text-xs text-slate-500 hover:text-yellow-400 transition-colors font-mono">
                      Sign in
                    </Link>
                  </div>
                </div>
              ) : (
              <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
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
                  <div className="text-xs font-mono text-slate-500 text-right">
                    Click cards to select for selling
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleSellAll}
                    disabled={isSelling}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 font-display tracking-wider text-sm transition-all disabled:opacity-50"
                  >
                    {isSelling ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <DollarSign size={15} />}
                    SELL ALL — {formatCurrency(totalValue)}
                  </button>

                  {selectedToSell.size > 0 && (
                    <button
                      onClick={handleSellSelected}
                      disabled={isSelling}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm transition-all disabled:opacity-50"
                    >
                      Sell {selectedToSell.size} selected
                    </button>
                  )}

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 text-sm transition-all"
                  >
                    <Share2 size={14} /> Share
                  </button>

                  <Link
                    href="/collection"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-sm transition-all"
                  >
                    <Package size={14} /> Collection
                  </Link>

                  <button
                    onClick={() => { setPhase('idle'); setRevealedCards([]); setWinningCards([]); setUserCardIds([]); setSpinIndex(0); setSelectedToSell(new Set()) }}
                    className="btn-gold flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  >
                    <RotateCcw size={14} /> Open Again
                  </button>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {showLowBalance && (
      <LowBalanceModal balance={balance} onClose={() => setShowLowBalance(false)} />
    )}
    </>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
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
