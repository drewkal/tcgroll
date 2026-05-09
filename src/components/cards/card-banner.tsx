// src/components/cards/card-banner.tsx
'use client'
import { getRarityColor } from '@/lib/opening-engine'

interface ShowcaseCard {
  id: string
  name: string
  imageUrl: string | null
  rarity: string
  game: string
}

const GAME_EMOJI: Record<string, string> = {
  POKEMON: '⚡', ONE_PIECE: '☠️', MAGIC: '✨', DRAGON_BALL: '🐉',
}

function BannerCard({ card, tilt }: { card: ShowcaseCard; tilt: number }) {
  const color = getRarityColor(card.rarity)
  const transform = `rotate(${tilt}deg)`

  return (
    <div
      className="relative flex-shrink-0 w-24 h-32 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-110 hover:rotate-0 hover:z-10"
      style={{
        transform,
        border: `1px solid ${color}50`,
        boxShadow: `0 4px 24px ${color}18`,
      }}
    >
      {/* top rarity stripe */}
      <div className="absolute top-0 inset-x-0 h-0.5 z-10" style={{ backgroundColor: color }} />

      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-3xl"
          style={{ background: `linear-gradient(135deg, ${color}25 0%, #0a0e1a 100%)` }}
        >
          {GAME_EMOJI[card.game] ?? '🃏'}
        </div>
      )}

      {/* name label */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-1.5 px-2">
        <p className="text-white text-[9px] font-medium truncate leading-tight">{card.name}</p>
        <p className="text-[8px] font-mono" style={{ color }}>{card.rarity}</p>
      </div>
    </div>
  )
}

export function CardBanner({ cards }: { cards: ShowcaseCard[] }) {
  if (cards.length < 3) return null

  // duplicate until we have ≥ 20 cards, then double for seamless -50% loop
  const base = cards.length < 10
    ? [...cards, ...cards, ...cards, ...cards]
    : [...cards, ...cards]

  const row1 = [...base, ...base]
  const row2 = [...base.slice().reverse(), ...base.slice().reverse()]

  return (
    <div
      className="relative w-full overflow-hidden py-5"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      {/* Row 1 — scrolls left */}
      <div className="flex gap-3 mb-3 animate-marquee-left" style={{ width: 'max-content' }}>
        {row1.map((card, i) => (
          <BannerCard key={`r1-${i}`} card={card} tilt={i % 2 === 0 ? 2 : -2} />
        ))}
      </div>

      {/* Row 2 — scrolls right */}
      <div className="flex gap-3 animate-marquee-right" style={{ width: 'max-content' }}>
        {row2.map((card, i) => (
          <BannerCard key={`r2-${i}`} card={card} tilt={i % 2 === 0 ? -2 : 2} />
        ))}
      </div>
    </div>
  )
}
