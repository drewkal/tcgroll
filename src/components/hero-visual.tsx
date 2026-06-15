'use client'
import { useEffect, useState } from 'react'
import { getRarityColor } from '@/lib/opening-engine'

interface HeroCard {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  game: string
}

const GAME_EMOJI: Record<string, string> = {
  POKEMON: '⚡', ONE_PIECE: '☠️', MAGIC: '✨', DRAGON_BALL: '🐉',
}

// offsetX from center, bottomPx from container bottom, rotateDeg, float delay + duration
const SLOTS = [
  { offsetX: -118, bottom: 52, rotate: -14, delay: '0.1s',  dur: '3.2s' },
  { offsetX:    0, bottom: 80, rotate:   0, delay: '0.6s',  dur: '2.8s' },
  { offsetX:  118, bottom: 52, rotate:  14, delay: '0.35s', dur: '3.5s' },
]

export function HeroVisual({ cards }: { cards: HeroCard[] }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="relative mx-auto select-none" style={{ width: 340, height: 260 }}>

      {/* Cards */}
      {cards.slice(0, 3).map((card, i) => {
        const slot = SLOTS[i]
        const color = getRarityColor(card.rarity)
        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: slot.bottom,
              // rotation applied here so heroFloat only translates Y
              transform: `translateX(calc(-50% + ${slot.offsetX}px)) rotate(${slot.rotate}deg)`,
              zIndex: i === 1 ? 3 : 2,
              opacity: visible ? 1 : 0,
              transition: `opacity 0.6s ease ${slot.delay}, transform 0.6s ease ${slot.delay}`,
            }}
          >
            {/* float wrapper — translateY only, no rotation conflict */}
            <div style={{
              animation: visible ? `heroFloat ${slot.dur} ease-in-out infinite` : 'none',
              animationDelay: slot.delay,
            }}>
              <div
                style={{
                  width: 88,
                  height: 120,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `2px solid ${color}70`,
                  boxShadow: `0 0 18px ${color}30, 0 10px 36px rgba(0,0,0,0.7)`,
                  position: 'relative',
                }}
              >
                {/* rarity top stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, zIndex: 1 }} />
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} width={88} height={120} loading="eager" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32,
                    background: `linear-gradient(135deg, ${color}22 0%, #080c18 100%)`,
                  }}>
                    {GAME_EMOJI[card.game] ?? '🃏'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Center case box */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 4,
        width: 68,
        height: 68,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #fbbf24, #d97706)',
        boxShadow: '0 0 32px rgba(251,191,36,0.55), 0 4px 24px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="38" height="38" viewBox="0 0 34 34" fill="none">
          <rect width="34" height="34" rx="8" fill="#0f1629"/>
          <circle cx="10" cy="10" r="3" fill="#9ca3af"/>
          <circle cx="24" cy="10" r="3" fill="#22c55e"/>
          <circle cx="17" cy="17" r="3" fill="#3b82f6"/>
          <circle cx="10" cy="24" r="3" fill="#a855f7"/>
          <circle cx="24" cy="24" r="3" fill="#f59e0b"/>
        </svg>
      </div>

    </div>
  )
}
