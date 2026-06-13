'use client'
import { useState, useCallback, useRef, useMemo, useEffect, useLayoutEffect } from 'react'
import { Card } from '@prisma/client'
import { getRarityColor } from '@/lib/opening-engine'

export const CARD_W    = 82
export const CARD_H    = 116
export const CARD_GAP  = 6
export const CARD_SLOT = CARD_W + CARD_GAP
const STRIP_LEN = 58
const WIN_IDX   = 50

type CaseCard = { card: Card; dropRate: number }

export function buildStrip(caseCards: CaseCard[], winner: Card): Card[] {
  const pool: Card[] = []
  for (const { card, dropRate } of caseCards) {
    const n = Math.max(1, Math.round(dropRate))
    for (let i = 0; i < n; i++) pool.push(card)
  }
  const pick = () => pool[Math.floor(Math.random() * pool.length)]
  return Array.from({ length: STRIP_LEN }, (_, i) => (i === WIN_IDX ? winner : pick()))
}

export function scheduleSpinTicks(): (() => void) {
  if (typeof window === 'undefined') return () => {}
  const ids: ReturnType<typeof setTimeout>[] = []
  let t = 0, interval = 55
  while (t < 4750) {
    const delay = t
    const vol = interval < 80 ? 0.07 : interval < 200 ? 0.05 : 0.03
    ids.push(setTimeout(() => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const g   = ctx.createGain()
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

export function playRevealSound(rarity: string) {
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
      osc.frequency.value = freq
      osc.type = rarity === 'LEGENDARY' ? 'sine' : 'triangle'
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)
      osc.start(ctx.currentTime + i * 0.08); osc.stop(ctx.currentTime + i * 0.08 + 0.35)
    })
  } catch {}
}

function ReelCard({ card, highlight }: { card: Card; highlight: boolean }) {
  const color = getRarityColor(card.rarity)
  return (
    <div style={{
      width: CARD_W, height: CARD_H, flexShrink: 0, borderRadius: 10,
      border: `2px solid ${highlight ? '#fbbf24' : color + '55'}`,
      background: `linear-gradient(160deg, ${color}22 0%, #0a0f1e 70%)`,
      boxShadow: highlight ? `0 0 28px ${color}, 0 0 56px ${color}55` : undefined,
      overflow: 'hidden', transition: 'box-shadow 0.5s, border-color 0.5s',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4,
    }}>
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: color + '33', border: `1px solid ${color}66` }} />
          <span style={{ color, fontSize: 9, fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.3 }}>
            {card.name.length > 14 ? card.name.slice(0, 13) + '…' : card.name}
          </span>
        </>
      )}
    </div>
  )
}

export function Celebration({ rarity }: { rarity: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const color = rarity === 'LEGENDARY' ? '#f59e0b' : '#a855f7'
  const secondary = rarity === 'LEGENDARY' ? '#fff7ed' : '#ede9fe'
  useLayoutEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!
    type P = { x:number;y:number;vx:number;vy:number;size:number;rot:number;rotV:number;color:string;shape:'rect'|'circle' }
    const palette = [color, secondary, '#ffffff', color, color]
    const particles: P[] = Array.from({ length: rarity === 'LEGENDARY' ? 140 : 90 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
      size: Math.random() * 7 + 3, rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 12,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }))
    const start = Date.now(); const DURATION = 3200; let raf: number
    const draw = () => {
      const elapsed = Date.now() - start; const fade = Math.max(0, 1 - elapsed / DURATION)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.rotV
        ctx.save(); ctx.globalAlpha = fade * 0.9; ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill() }
        ctx.restore()
      }
      if (elapsed < DURATION) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [color, secondary, rarity])
  return <canvas ref={canvasRef} className="fixed inset-0 z-40 pointer-events-none" />
}

export function SpinReel({ caseCards, winner, onComplete }: {
  caseCards: CaseCard[]
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
    doneRef.current = true; cancelTicks.current?.()
    setLanded(true); if (isBig) setFlash(true)
    playRevealSound(winner.rarity)
    setTimeout(onComplete, isBig ? 1800 : 1100)
  }, [winner.rarity, onComplete, isBig])

  const rarityColor = getRarityColor(winner.rarity)

  return (
    <>
      {flash && <div className="fixed inset-0 z-30 pointer-events-none animate-ping-once" style={{ backgroundColor: rarityColor + '30' }} />}
      {flash && <Celebration rarity={winner.rarity} />}
      <div className="relative select-none" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <div className="absolute top-0 left-1/2 z-20 pointer-events-none" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '12px solid #fbbf24' }} />
        <div className="absolute bottom-0 left-1/2 z-20 pointer-events-none" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '12px solid #fbbf24' }} />
        <div ref={containerRef} className="overflow-hidden relative" style={{ height: CARD_H + 4 }}>
          <div className="absolute inset-y-0 left-0 z-10 pointer-events-none" style={{ width: 100, background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 right-0 z-10 pointer-events-none" style={{ width: 100, background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)', width: CARD_W + 4, border: '2px solid rgba(251,191,36,0.55)', borderRadius: 12, boxShadow: '0 0 12px rgba(251,191,36,0.2)' }} />
          <div style={{ display: 'flex', gap: CARD_GAP, paddingTop: 2, transform: `translateX(${tx}px)`, transition: started ? 'transform 4.8s cubic-bezier(0.06, 0.8, 0.2, 1)' : 'none', willChange: 'transform' }} onTransitionEnd={onEnd}>
            {strip.map((card, i) => <ReelCard key={i} card={card} highlight={landed && i === WIN_IDX} />)}
          </div>
        </div>
      </div>
    </>
  )
}
