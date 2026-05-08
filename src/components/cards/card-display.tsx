// src/components/cards/card-display.tsx
'use client'
import Image from 'next/image'
import { useState } from 'react'
import { Expand } from 'lucide-react'
import { Card } from '@prisma/client'
import { cn, formatCurrency, getRarityLabel, getPokemonTypeColor } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { CardDetailModal } from './card-detail-modal'

interface CardDisplayProps {
  card: Card & { game?: string }
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  onSelect?: () => void
  showSell?: boolean
}

const sizeMap = {
  sm: { card: 'w-28 h-40', name: 'text-xs', value: 'text-xs' },
  md: { card: 'w-36 h-52', name: 'text-sm', value: 'text-sm' },
  lg: { card: 'w-48 h-64', name: 'text-base', value: 'text-base' },
}

const rarityBg: Record<string, string> = {
  COMMON: 'from-gray-800 to-gray-900 border-gray-600/40',
  UNCOMMON: 'from-green-950 to-gray-900 border-green-500/40',
  RARE: 'from-blue-950 to-gray-900 border-blue-500/50',
  EPIC: 'from-purple-950 to-gray-900 border-purple-500/60',
  LEGENDARY: 'from-yellow-950 to-amber-950 border-yellow-400/70',
}

const rarityGlowClass: Record<string, string> = {
  COMMON: '',
  UNCOMMON: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]',
  RARE: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
  EPIC: 'epic-glow',
  LEGENDARY: 'legendary-glow',
}

export function CardDisplay({ card, size = 'md', selected, onSelect, showSell }: CardDisplayProps) {
  const [showModal, setShowModal] = useState(false)
  const sizes = sizeMap[size]
  const rarityColor = getRarityColor(card.rarity)
  const isPokemon = !card.game || card.game === 'POKEMON'
  const typeColor = getPokemonTypeColor(card.pokemonType)

  return (
    <>
    <div
      className={cn(
        'relative flex flex-col rounded-xl border-2 bg-gradient-to-b overflow-hidden cursor-pointer transition-all duration-300 group',
        sizes.card,
        rarityBg[card.rarity] ?? rarityBg.COMMON,
        rarityGlowClass[card.rarity],
        selected && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-navy-900 scale-105',
        onSelect && 'hover:scale-105',
        card.rarity === 'LEGENDARY' && 'holo-card',
      )}
      onClick={onSelect}
    >
      {/* Rarity stripe at top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: rarityColor }}
      />

      {/* Card image area */}
      <div className="relative flex-1 flex items-center justify-center p-2 min-h-0">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 120px, 200px"
          />
        ) : (
          <PokemonCardPlaceholder name={card.name} type={isPokemon ? card.pokemonType : 'NORMAL'} typeColor={isPokemon ? typeColor : '#9ca3af'} rarity={card.rarity} />
        )}
      </div>

      {/* Card footer */}
      <div className="bg-black/40 backdrop-blur-sm px-2 py-1.5 flex flex-col gap-0.5">
        <p className={cn('font-display tracking-wide text-white leading-tight truncate', sizes.name)}>
          {card.name}
        </p>
        <div className="flex items-center justify-between">
          <span
            className="rarity-badge"
            style={{ color: rarityColor, backgroundColor: `${rarityColor}20` }}
          >
            {getRarityLabel(card.rarity)}
          </span>
          <span className={cn('font-mono text-yellow-400 font-semibold', sizes.value)}>
            {formatCurrency(card.value)}
          </span>
        </div>
      </div>

      {/* Type pill — Pokémon only */}
      {isPokemon && (
        <div
          className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
          style={{ backgroundColor: `${typeColor}30`, color: typeColor, border: `1px solid ${typeColor}50` }}
        >
          {card.pokemonType}
        </div>
      )}

      {/* Selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-yellow-400/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-gold-glow">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Expand button */}
      <button
        onClick={e => { e.stopPropagation(); setShowModal(true) }}
        className="absolute bottom-10 right-1.5 z-20 w-6 h-6 rounded-md bg-black/60 flex items-center justify-center text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Expand size={11} />
      </button>
    </div>

    <CardDetailModal card={showModal ? card : null} onClose={() => setShowModal(false)} />
    </>
  )
}

function PokemonCardPlaceholder({ name, type, typeColor, rarity }: {
  name: string, type: string, typeColor: string, rarity: string
}) {
  const isLegendary = rarity === 'LEGENDARY'
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${typeColor}20`, border: `2px solid ${typeColor}50` }}
      >
        {getPokemonEmoji(type)}
      </div>
      {isLegendary && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-yellow-400/60"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}
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
