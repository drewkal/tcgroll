'use client'
import { useEffect, useState } from 'react'
import { getRarityColor } from '@/lib/opening-engine'

interface GameCard {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  game: string
}

const GAME_EMOJI: Record<string, string> = {
  POKEMON: '⚡', ONE_PIECE: '☠️', MAGIC: '✨', DRAGON_BALL: '🐉',
}

const SLOTS = [
  { offsetX: -64, rotate: -14, delay: '0.1s',  dur: '3.2s', z: 2 },
  { offsetX:   0, rotate:   0, delay: '0.5s',  dur: '2.8s', z: 3 },
  { offsetX:  64, rotate:  14, delay: '0.3s',  dur: '3.5s', z: 2 },
]

export function GameCardVisual({ cards, color }: { cards: GameCard[]; color: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t) }, [])

  return (
    <div className="relative select-none" style={{ width: 180, height: 120 }}>
      {cards.slice(0, 3).map((card, i) => {
        const slot  = SLOTS[i]
        const rColor = getRarityColor(card.rarity)
        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              transform: `translateX(calc(-50% + ${slot.offsetX}px)) rotate(${slot.rotate}deg)`,
              zIndex: slot.z,
              opacity: visible ? 1 : 0,
              transition: `opacity 0.5s ease ${slot.delay}`,
            }}
          >
            <div style={{
              animation: visible ? `heroFloat ${slot.dur} ease-in-out infinite` : 'none',
              animationDelay: slot.delay,
            }}>
              <div style={{
                width: 58,
                height: 80,
                borderRadius: 8,
                overflow: 'hidden',
                border: `2px solid ${rColor}80`,
                boxShadow: `0 0 14px ${rColor}40, 0 6px 20px rgba(0,0,0,0.7)`,
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: rColor, zIndex: 1 }} />
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                    background: `linear-gradient(135deg, ${rColor}22 0%, #080c18 100%)`,
                  }}>
                    {GAME_EMOJI[card.game] ?? '🃏'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
