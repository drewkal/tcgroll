// src/components/cards/card-detail-modal.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { formatCurrency, getRarityLabel, getPokemonTypeColor } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'

interface Card {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  value: number
  game?: string | null
  pokemonType: string
  setName?: string | null
  description?: string | null
}

interface Props {
  card: Card | null
  onClose: () => void
}

const rarityBg: Record<string, string> = {
  COMMON:    'from-gray-800/80 to-gray-900/80',
  UNCOMMON:  'from-green-950/80 to-gray-900/80',
  RARE:      'from-blue-950/80 to-gray-900/80',
  EPIC:      'from-purple-950/80 to-gray-900/80',
  LEGENDARY: 'from-yellow-950/80 to-amber-950/80',
}

export function CardDetailModal({ card, onClose }: Props) {
  const [tilt, setTilt]   = useState({ x: 0, y: 0 })
  const [shine, setShine] = useState({ x: 50, y: 50 })
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [card, onClose])

  if (!card) return null

  const rarityColor = getRarityColor(card.rarity)
  const isPokemon   = !card.game || card.game === 'POKEMON'
  const typeColor   = getPokemonTypeColor(card.pokemonType)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top)  / rect.height
    setTilt({ x: (py - 0.5) * -22, y: (px - 0.5) * 22 })
    setShine({ x: px * 100, y: py * 100 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setShine({ x: 50, y: 50 })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-sm rounded-3xl bg-gradient-to-b ${rarityBg[card.rarity] ?? rarityBg.COMMON} border overflow-hidden`}
        style={{ borderColor: rarityColor + '50' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ backgroundColor: rarityColor }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Card image — tilt zone */}
        <div
          ref={imgRef}
          className="relative w-full aspect-[3/4] bg-black/20 cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease' : 'transform 0.08s ease',
          }}
        >
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ backgroundColor: rarityColor + '20', border: `2px solid ${rarityColor}50` }}
              >
                {isPokemon ? getPokemonEmoji(card.pokemonType) : '🃏'}
              </div>
            </div>
          )}
          {/* Shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-t-3xl"
            style={{
              background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.14) 0%, transparent 60%)`,
              opacity: tilt.x === 0 && tilt.y === 0 ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
          />
          {/* Type badge — Pokémon only */}
          {isPokemon && (
            <div
              className="absolute top-4 left-4 px-2 py-1 rounded-lg text-xs font-mono font-semibold"
              style={{ backgroundColor: typeColor + '25', color: typeColor, border: `1px solid ${typeColor}40` }}
            >
              {card.pokemonType}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 bg-black/30">
          <div>
            <h2 className="font-display text-3xl text-white tracking-wide leading-tight">{card.name}</h2>
            {card.setName && (
              <p className="text-slate-400 text-sm font-mono mt-1">{card.setName}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className="rarity-badge text-sm px-3 py-1"
              style={{ color: rarityColor, backgroundColor: rarityColor + '20', border: `1px solid ${rarityColor}40` }}
            >
              {getRarityLabel(card.rarity)}
            </span>
            <span className="font-display text-2xl text-yellow-400">{formatCurrency(card.value)}</span>
          </div>

          {card.description && (
            <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
              {card.description}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function getPokemonEmoji(type: string): string {
  const emojis: Record<string, string> = {
    FIRE: '🔥', WATER: '💧', GRASS: '🌿', ELECTRIC: '⚡',
    PSYCHIC: '🔮', ICE: '❄️', FIGHTING: '👊', POISON: '☠️',
    GROUND: '🌍', FLYING: '🌪️', BUG: '🐛', ROCK: '🪨',
    GHOST: '👻', DRAGON: '🐉', DARK: '🌑', STEEL: '⚙️',
    FAIRY: '✨', NORMAL: '⭐',
  }
  return emojis[type] ?? '⭐'
}
