'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getRarityColor } from '@/lib/opening-engine'
import { formatCurrency } from '@/lib/utils'

const CARD_W    = 68
const CARD_H    = 95
const CARD_GAP  = 8
const CARD_SLOT = CARD_W + CARD_GAP
const STRIP_LEN = 40
const WIN_IDX   = 32

type Card  = { id: string; name: string; imageUrl: string | null; rarity: string; value: number }
type Entry = { card: Card; dropRate: number }

function buildStrip(pool: Card[], winner: Card): Card[] {
  const pick = () => pool[Math.floor(Math.random() * pool.length)]
  return Array.from({ length: STRIP_LEN }, (_, i) => (i === WIN_IDX ? winner : pick()))
}

export function HeroOpeningDemo({ entries, showcase }: { entries: Entry[]; showcase: Card }) {
  const pool   = useMemo(() => entries.map(e => e.card), [entries])
  const color  = getRarityColor(showcase.rarity)

  const [phase,       setPhase]       = useState<'waiting' | 'spinning' | 'reveal' | 'inventory'>('waiting')
  const [strip,       setStrip]       = useState<Card[]>([])
  const [reelTx,      setReelTx]      = useState(0)
  const [reelStarted, setReelStarted] = useState(false)
  const [reelLanded,  setReelLanded]  = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const doneRef      = useRef(false)
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
    return t
  }, [])

  const startSpin = useCallback(() => {
    clearTimers()
    doneRef.current  = false
    setStrip(buildStrip(pool.length > 0 ? pool : [showcase], showcase))
    setReelLanded(false)
    setReelStarted(false)
    setReelTx(0)
    setPhase('spinning')
    later(() => {
      const w = containerRef.current?.offsetWidth ?? 500
      setReelTx(-(WIN_IDX * CARD_SLOT - w / 2 + CARD_W / 2))
      setReelStarted(true)
    }, 150)
  }, [pool, showcase, clearTimers, later])

  useEffect(() => {
    const t = setTimeout(startSpin, 700)
    return () => { clearTimeout(t); clearTimers() }
  }, [startSpin, clearTimers])

  const onReelEnd = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setReelLanded(true)
    later(() => setPhase('reveal'),    500)
    later(() => setPhase('inventory'), 2800)
    later(startSpin,                   5800)
  }, [later, startSpin])

  const rarityLabel =
    showcase.rarity === 'LEGENDARY' ? '🏆 LEGENDARY PULL!'
    : showcase.rarity === 'EPIC'    ? '✨ EPIC PULL!'
    : `✦ ${showcase.rarity}`

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(251,191,36,0.04) 0%, rgba(8,12,24,0.97) 100%)' }}>

        {/* Chrome bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 tracking-widest">LIVE PREVIEW</span>
          </div>
          <span className="text-[10px] font-mono text-slate-600">no sign-up needed</span>
        </div>

        <div className="px-4 py-4 min-h-[130px] flex items-center">

          {/* Waiting */}
          {phase === 'waiting' && (
            <div className="flex-1 flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
            </div>
          )}

          {/* Spinning reel */}
          {phase === 'spinning' && (
            <div className="flex-1 relative select-none" style={{ paddingTop: 12, paddingBottom: 12 }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '10px solid #fbbf24' }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '10px solid #fbbf24' }} />

              <div ref={containerRef} className="overflow-hidden relative" style={{ height: CARD_H + 4 }}>
                <div className="absolute inset-y-0 left-0 z-10 pointer-events-none"
                  style={{ width: 70, background: 'linear-gradient(to right, #080c18, transparent)' }} />
                <div className="absolute inset-y-0 right-0 z-10 pointer-events-none"
                  style={{ width: 70, background: 'linear-gradient(to left, #080c18, transparent)' }} />
                <div className="absolute inset-y-0 left-1/2 z-10 pointer-events-none"
                  style={{ transform: 'translateX(-50%)', width: CARD_W + 4,
                    border: '2px solid rgba(251,191,36,0.45)', borderRadius: 10,
                    boxShadow: '0 0 14px rgba(251,191,36,0.15)' }} />

                <div style={{
                  display: 'flex', gap: CARD_GAP, paddingTop: 2,
                  transform: `translateX(${reelTx}px)`,
                  transition: reelStarted ? 'transform 4.8s cubic-bezier(0.06, 0.8, 0.2, 1)' : 'none',
                  willChange: 'transform',
                }} onTransitionEnd={onReelEnd}>
                  {strip.map((card, i) => {
                    const c = getRarityColor(card.rarity)
                    const win = reelLanded && i === WIN_IDX
                    return (
                      <div key={i} style={{
                        width: CARD_W, height: CARD_H, flexShrink: 0, borderRadius: 8,
                        border: `2px solid ${win ? '#fbbf24' : c + '44'}`,
                        background: `linear-gradient(160deg, ${c}18 0%, #0a0f1e 70%)`,
                        boxShadow: win ? `0 0 24px ${c}cc, 0 0 48px ${c}55` : undefined,
                        overflow: 'hidden', transition: 'box-shadow 0.4s, border-color 0.4s',
                      }}>
                        {card.imageUrl
                          ? <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, fontSize: 9, fontFamily: 'monospace' }}>?</div>
                        }
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Reveal + inventory */}
          {(phase === 'reveal' || phase === 'inventory') && (
            <div className="flex-1 flex items-center gap-5 animate-fade-in">
              <div className={phase === 'reveal' ? 'animate-card-reveal' : ''} style={{
                width: 76, height: 106, flexShrink: 0, borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${color}`,
                boxShadow: `0 0 28px ${color}80, 0 0 56px ${color}30`,
              }}>
                {showcase.imageUrl
                  ? <img src={showcase.imageUrl} alt={showcase.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${color}22, #080c18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🃏</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color }}>
                  {rarityLabel}
                </div>
                <div className="font-display text-base text-white leading-tight truncate">{showcase.name}</div>
                <div className="font-mono text-yellow-400 text-sm mt-0.5">{formatCurrency(showcase.value)}</div>

                {phase === 'inventory' && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400 font-mono animate-fade-in">
                    <CheckCircle2 size={12} />
                    Added to inventory
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
