'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

type Player = { name: string | null; image: string | null }

const SLOT_W    = 110
const SLOT_H    = 150
const SLOT_GAP  = 8
const SLOT_STEP = SLOT_W + SLOT_GAP
const WIN_IDX   = 30

function buildStrip(creator: Player, joiner: Player, winnerIsCreator: boolean): Player[] {
  const strip: Player[] = Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? creator : joiner))
  strip[WIN_IDX] = winnerIsCreator ? creator : joiner
  // ensure the slot before and after aren't the same as the winner so it reads clearly
  strip[WIN_IDX - 1] = winnerIsCreator ? joiner : creator
  strip[WIN_IDX + 1] = winnerIsCreator ? joiner : creator
  return strip
}

function PlayerSlot({ player, highlight }: { player: Player; highlight: boolean }) {
  const initials = (player.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl transition-all duration-500"
      style={{
        width: SLOT_W, height: SLOT_H,
        background: highlight ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${highlight ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: highlight ? '0 0 20px rgba(251,191,36,0.2)' : undefined,
      }}
    >
      <div
        className="rounded-full overflow-hidden flex items-center justify-center font-display text-white flex-shrink-0"
        style={{
          width: 62, height: 62,
          background: player.image ? undefined : 'linear-gradient(135deg, #1e2d4a, #0f1629)',
          border: `2px solid ${highlight ? '#fbbf24' : 'rgba(255,255,255,0.15)'}`,
          fontSize: 20,
        }}
      >
        {player.image
          ? <img src={player.image} alt={player.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>
      <span
        className="font-display text-xs text-white tracking-wide text-center px-1"
        style={{ maxWidth: SLOT_W - 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {player.name ?? 'Player'}
      </span>
    </div>
  )
}

export function TiebreakerReel({ creator, joiner, winnerId, creatorId, onComplete }: {
  creator: Player; joiner: Player
  winnerId: string; creatorId: string
  onComplete: () => void
}) {
  const winnerIsCreator = winnerId === creatorId
  const strip        = useMemo(() => buildStrip(creator, joiner, winnerIsCreator), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const doneRef      = useRef(false)
  const [tx,      setTx]      = useState(0)
  const [started, setStarted] = useState(false)
  const [landed,  setLanded]  = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const w = containerRef.current?.offsetWidth ?? 600
      setTx(-(WIN_IDX * SLOT_STEP - w / 2 + SLOT_W / 2))
      setStarted(true)
    }, 60)
    return () => clearTimeout(t)
  }, [])

  const onEnd = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setLanded(true)
    setTimeout(onComplete, 2200)
  }, [onComplete])

  const winner = winnerIsCreator ? creator : joiner

  return (
    <div>
      <div className="relative select-none" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <div className="absolute top-0 left-1/2 z-20 pointer-events-none" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '12px solid #fbbf24' }} />
        <div className="absolute bottom-0 left-1/2 z-20 pointer-events-none" style={{ transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '12px solid #fbbf24' }} />
        <div ref={containerRef} className="overflow-hidden relative" style={{ height: SLOT_H + 4 }}>
          <div className="absolute inset-y-0 left-0 z-10 pointer-events-none" style={{ width: 100, background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 right-0 z-10 pointer-events-none" style={{ width: 100, background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />
          <div className="absolute inset-y-0 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)', width: SLOT_W + 4, border: '2px solid rgba(251,191,36,0.55)', borderRadius: 12, boxShadow: '0 0 12px rgba(251,191,36,0.2)' }} />
          <div
            style={{ display: 'flex', gap: SLOT_GAP, paddingTop: 2, transform: `translateX(${tx}px)`, transition: started ? 'transform 4.8s cubic-bezier(0.06, 0.8, 0.2, 1)' : 'none', willChange: 'transform' }}
            onTransitionEnd={onEnd}
          >
            {strip.map((player, i) => (
              <PlayerSlot key={i} player={player} highlight={landed && i === WIN_IDX} />
            ))}
          </div>
        </div>
      </div>

      {landed && (
        <div className="text-center mt-3 animate-fade-in">
          <p className="font-display text-2xl text-yellow-400 tracking-widest text-glow-gold">
            {winner.name?.toUpperCase() ?? 'WINNER'} WINS!
          </p>
          <p className="text-slate-500 text-xs font-mono mt-1">decided by tiebreaker spin</p>
        </div>
      )}
    </div>
  )
}
