'use client'
import { useState, useCallback, useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Zap, RotateCcw } from 'lucide-react'
import { getRarityColor } from '@/lib/opening-engine'
import { formatCurrency } from '@/lib/utils'

// ─── Reel constants ───────────────────────────────────────────────────
const CARD_W    = 82
const CARD_H    = 116
const CARD_GAP  = 6
const CARD_SLOT = CARD_W + CARD_GAP
const STRIP_LEN = 58
const WIN_IDX   = 50

type DemoCard = { id: string; name: string; imageUrl: string | null; rarity: string; value: number }
type Entry    = { card: DemoCard; dropRate: number }

function buildPool(entries: Entry[]): DemoCard[] {
  const out: DemoCard[] = []
  for (const { card, dropRate } of entries) {
    const n = Math.max(1, Math.round(dropRate))
    for (let i = 0; i < n; i++) out.push(card)
  }
  return out
}

function buildStrip(entries: Entry[], winner: DemoCard): DemoCard[] {
  const p   = buildPool(entries)
  const pick = () => p[Math.floor(Math.random() * p.length)]
  return Array.from({ length: STRIP_LEN }, (_, i) => (i === WIN_IDX ? winner : pick()))
}

function weightedPick(entries: Entry[]): DemoCard {
  const p = buildPool(entries)
  return p[Math.floor(Math.random() * p.length)]
}

function scheduleSpinTicks(): () => void {
  if (typeof window === 'undefined') return () => {}
  const ids: ReturnType<typeof setTimeout>[] = []
  let t = 0; let interval = 55
  while (t < 4750) {
    const delay = t
    const vol   = interval < 80 ? 0.07 : interval < 200 ? 0.05 : 0.03
    ids.push(setTimeout(() => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'square'; osc.frequency.value = 900 + Math.random() * 100
        g.gain.setValueAtTime(vol, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.025)
      } catch {}
    }, delay))
    interval = Math.min(500, interval * 1.085); t += interval
  }
  return () => ids.forEach(clearTimeout)
}

function playRevealSound(rarity: string) {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const freqMap: Record<string, number[]> = {
      COMMON: [220, 280], UNCOMMON: [330, 440], RARE: [440, 660],
      EPIC: [550, 880, 1100], LEGENDARY: [660, 880, 1100, 1320],
    }
    const freqs = freqMap[rarity] ?? [330]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = rarity === 'LEGENDARY' ? 'sine' : 'triangle'
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)
      osc.start(ctx.currentTime + i * 0.08); osc.stop(ctx.currentTime + i * 0.08 + 0.35)
    })
  } catch {}
}

// ─── Single reel card ─────────────────────────────────────────────────
function ReelCard({ card, highlight }: { card: DemoCard; highlight: boolean }) {
  const color = getRarityColor(card.rarity)
  return (
    <div style={{
      width: CARD_W, height: CARD_H, flexShrink: 0, borderRadius: 10,
      border: `2px solid ${highlight ? '#fbbf24' : color + '55'}`,
      background: `linear-gradient(160deg, ${color}22 0%, #0a0f1e 70%)`,
      boxShadow: highlight ? `0 0 28px ${color}, 0 0 56px ${color}55` : undefined,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4,
      transition: 'box-shadow 0.5s, border-color 0.5s',
    }}>
      {card.imageUrl
        ? <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
        : <>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: color + '33', border: `1px solid ${color}66` }} />
            <span style={{ color, fontSize: 9, fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.3 }}>
              {card.name.length > 14 ? card.name.slice(0, 13) + '…' : card.name}
            </span>
          </>
      }
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────
function Confetti({ rarity }: { rarity: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const primary   = rarity === 'LEGENDARY' ? '#f59e0b' : '#a855f7'
  const secondary = rarity === 'LEGENDARY' ? '#fff7ed' : '#ede9fe'

  useLayoutEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!
    type P = { x: number; y: number; vx: number; vy: number; size: number; rot: number; rotV: number; color: string; circle: boolean }
    const palette = [primary, secondary, '#fff', primary, primary]
    const particles: P[] = Array.from({ length: rarity === 'LEGENDARY' ? 140 : 90 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
      size: Math.random() * 7 + 3, rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 12,
      color: palette[Math.floor(Math.random() * palette.length)],
      circle: Math.random() > 0.4,
    }))
    const start = Date.now(); const DUR = 3200; let raf: number
    const draw = () => {
      const elapsed = Date.now() - start; const fade = Math.max(0, 1 - elapsed / DUR)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.rotV
        ctx.save(); ctx.globalAlpha = fade * 0.9
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
        ctx.fillStyle = p.color
        if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
        else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      }
      if (elapsed < DUR) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [primary, secondary, rarity])

  return <canvas ref={canvasRef} className="fixed inset-0 z-40 pointer-events-none" />
}

// ─── Spin reel ────────────────────────────────────────────────────────
function SpinReel({ entries, winner, onComplete }: { entries: Entry[]; winner: DemoCard; onComplete: () => void }) {
  const strip        = useMemo(() => buildStrip(entries, winner), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const doneRef      = useRef(false)
  const cancelTicks  = useRef<(() => void) | null>(null)
  const [tx, setTx]           = useState(0)
  const [started, setStarted] = useState(false)
  const [landed, setLanded]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const w = containerRef.current?.offsetWidth ?? 700
      setTx(-(WIN_IDX * CARD_SLOT - w / 2 + CARD_W / 2))
      setStarted(true)
      cancelTicks.current = scheduleSpinTicks()
    }, 60)
    return () => { clearTimeout(t); cancelTicks.current?.() }
  }, [])

  const onEnd = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    cancelTicks.current?.()
    setLanded(true)
    playRevealSound(winner.rarity)
    setTimeout(onComplete, 1400)
  }, [winner.rarity, onComplete])

  return (
    <div className="relative select-none" style={{ paddingTop: 14, paddingBottom: 14 }}>
      <div className="absolute top-0 left-1/2 z-20 pointer-events-none"
        style={{ transform: 'translateX(-50%)', width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
          borderTop: '12px solid #fbbf24' }} />
      <div className="absolute bottom-0 left-1/2 z-20 pointer-events-none"
        style={{ transform: 'translateX(-50%)', width: 0, height: 0,
          borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
          borderBottom: '12px solid #fbbf24' }} />

      <div ref={containerRef} className="overflow-hidden relative" style={{ height: CARD_H + 4 }}>
        <div className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{ width: 100, background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
        <div className="absolute inset-y-0 right-0 z-10 pointer-events-none"
          style={{ width: 100, background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />
        <div className="absolute inset-y-0 left-1/2 z-10 pointer-events-none"
          style={{ transform: 'translateX(-50%)', width: CARD_W + 4,
            border: '2px solid rgba(251,191,36,0.55)', borderRadius: 12,
            boxShadow: '0 0 12px rgba(251,191,36,0.2)' }} />
        <div style={{
          display: 'flex', gap: CARD_GAP, paddingTop: 2,
          transform: `translateX(${tx}px)`,
          transition: started ? 'transform 4.8s cubic-bezier(0.06, 0.8, 0.2, 1)' : 'none',
          willChange: 'transform',
        }} onTransitionEnd={onEnd}>
          {strip.map((card, i) => <ReelCard key={i} card={card} highlight={landed && i === WIN_IDX} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Main demo component ──────────────────────────────────────────────
export function DemoRoll({ caseName, caseCards }: { caseName: string; caseCards: Entry[] }) {
  const { status } = useSession()
  const [phase, setPhase]   = useState<'idle' | 'spinning' | 'reveal' | 'done'>('idle')
  const [winner, setWinner] = useState<DemoCard | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [rolls, setRolls]   = useState(0)

  if (status === 'authenticated' || caseCards.length === 0) return null

  const handleRoll = () => {
    const w = weightedPick(caseCards)
    setWinner(w)
    setShowConfetti(false)
    setPhase('spinning')
  }

  const handleSpinComplete = useCallback(() => {
    if (!winner) return
    const isBig = winner.rarity === 'LEGENDARY' || winner.rarity === 'EPIC'
    if (isBig) setShowConfetti(true)
    setPhase('reveal')
    setTimeout(() => { setShowConfetti(false); setPhase('done') }, isBig ? 2500 : 1800)
  }, [winner])

  const handleAgain = () => {
    setWinner(null)
    setPhase('idle')
    setRolls(r => r + 1)
  }

  const rarityColor = winner ? getRarityColor(winner.rarity) : '#fbbf24'
  const previewCards = caseCards.slice(0, 6)

  return (
    <section className="px-4 pb-14 max-w-7xl mx-auto">
      {showConfetti && winner && <Confetti rarity={winner.rarity} />}

      <div className="relative rounded-3xl border border-yellow-400/20 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(251,191,36,0.04) 0%, rgba(8,13,26,0.95) 100%)' }}>

        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 rounded-full bg-yellow-400/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative text-center pt-8 pb-5 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-mono mb-3">
            <Zap size={11} className="fill-yellow-400" /> FREE DEMO — NO ACCOUNT NEEDED
          </div>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide text-white">TRY A ROLL</h2>
          <p className="text-slate-400 text-sm mt-1">
            Opening: <span className="text-white font-medium">{caseName}</span>
          </p>
        </div>

        <div className="relative px-4 pb-8 max-w-2xl mx-auto">

          {/* ── IDLE ── */}
          {phase === 'idle' && (
            <div className="text-center space-y-5">
              {/* Card preview strip */}
              <div className="flex justify-center gap-2">
                {previewCards.map(({ card }) => {
                  const c = getRarityColor(card.rarity)
                  return (
                    <div key={card.id} className="w-12 h-[68px] sm:w-14 sm:h-20 rounded-lg border flex-shrink-0 overflow-hidden"
                      style={{ borderColor: c + '55', background: `linear-gradient(160deg, ${c}22 0%, #0a0f1e 80%)` }}>
                      {card.imageUrl
                        ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-mono" style={{ color: c }}>?</div>
                      }
                    </div>
                  )
                })}
                {caseCards.length > 6 && (
                  <div className="w-12 h-[68px] sm:w-14 sm:h-20 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 text-xs font-mono flex-shrink-0">
                    +{caseCards.length - 6}
                  </div>
                )}
              </div>

              <button
                onClick={handleRoll}
                className="btn-gold w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-4 rounded-xl font-display text-xl tracking-widest shadow-gold-glow animate-glow-pulse"
              >
                <Zap size={20} className="fill-black" />
                ROLL FOR FREE
              </button>
              <p className="text-xs text-slate-500 font-mono">No credit card · No sign-up required</p>
            </div>
          )}

          {/* ── SPINNING ── */}
          {(phase === 'spinning' || phase === 'reveal') && winner && (
            <div className="glass rounded-2xl border border-yellow-400/20 p-4 overflow-hidden">
              {phase === 'spinning' && (
                <SpinReel
                  key={`spin-${rolls}`}
                  entries={caseCards}
                  winner={winner}
                  onComplete={handleSpinComplete}
                />
              )}
              {phase === 'reveal' && (
                <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
                  <div className="w-32 h-44 rounded-xl overflow-hidden border-2"
                    style={{ borderColor: rarityColor, boxShadow: `0 0 32px ${rarityColor}55` }}>
                    {winner.imageUrl
                      ? <img src={winner.imageUrl} alt={winner.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl"
                          style={{ background: `linear-gradient(135deg, ${rarityColor}22, #0a0f1e)` }}>🎴</div>
                    }
                  </div>
                  <div className="text-center">
                    <div className="font-display text-3xl tracking-wide text-white">{winner.name}</div>
                    <div className="font-mono text-yellow-400 text-xl mt-1">{formatCurrency(winner.value)}</div>
                    <div className="text-sm font-mono mt-1" style={{ color: rarityColor }}>
                      {winner.rarity === 'LEGENDARY' ? '🏆 LEGENDARY PULL!'
                        : winner.rarity === 'EPIC' ? '✨ EPIC PULL!'
                        : winner.rarity}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && winner && (
            <div className="space-y-4 animate-fade-in">
              {/* Result card */}
              <div className="flex items-center gap-4 rounded-2xl border p-4"
                style={{
                  borderColor: rarityColor + '50',
                  background: `radial-gradient(ellipse at left, ${rarityColor}10 0%, transparent 60%)`,
                }}>
                <div className="w-20 h-28 rounded-xl overflow-hidden border-2 flex-shrink-0"
                  style={{ borderColor: rarityColor + '80', boxShadow: `0 0 20px ${rarityColor}40` }}>
                  {winner.imageUrl
                    ? <img src={winner.imageUrl} alt={winner.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl"
                        style={{ background: `linear-gradient(135deg, ${rarityColor}22, #0a0f1e)` }}>🎴</div>
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-mono tracking-widest mb-1" style={{ color: rarityColor }}>{winner.rarity}</div>
                  <div className="font-display text-xl text-white truncate">{winner.name}</div>
                  <div className="font-mono text-yellow-400 text-lg">{formatCurrency(winner.value)}</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">demo only — not saved to account</div>
                </div>
              </div>

              {/* Sign up CTA */}
              <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5 text-center space-y-3">
                <div className="font-display text-xl text-white tracking-wide">Play for real cards</div>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Create a free account and get{' '}
                  <span className="text-yellow-400 font-semibold">🪙 500 bonus tokens</span>.
                  Open real cases, win physical cards shipped to your door.
                </p>
                <Link href="/register"
                  className="btn-gold inline-flex items-center gap-2 px-7 py-3 rounded-xl font-display tracking-widest shadow-gold-glow">
                  <Zap size={16} className="fill-black" />
                  Claim 500 Free Tokens
                </Link>
                <div>
                  <button
                    onClick={handleAgain}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono inline-flex items-center gap-1.5 mt-1"
                  >
                    <RotateCcw size={11} /> Roll again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
