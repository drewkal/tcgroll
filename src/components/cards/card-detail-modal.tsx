// src/components/cards/card-detail-modal.tsx
'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { formatCurrency, getRarityLabel, getPokemonTypeColor } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'

interface Card {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  value: number
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
  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [card, onClose])

  if (!card) return null

  const rarityColor = getRarityColor(card.rarity)
  const typeColor   = getPokemonTypeColor(card.pokemonType)

  return (
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

        {/* Card image */}
        <div className="relative w-full aspect-[3/4] bg-black/20">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ backgroundColor: typeColor + '20', border: `2px solid ${typeColor}50` }}
              >
                {getPokemonEmoji(card.pokemonType)}
              </div>
            </div>
          )}
          {/* Type badge */}
          <div
            className="absolute top-4 left-4 px-2 py-1 rounded-lg text-xs font-mono font-semibold"
            style={{ backgroundColor: typeColor + '25', color: typeColor, border: `1px solid ${typeColor}40` }}
          >
            {card.pokemonType}
          </div>
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
    </div>
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
