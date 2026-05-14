// src/components/cards/case-card.tsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { formatCurrency, getTierLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Package, Users, ChevronRight, Sparkles } from 'lucide-react'

interface TopCard {
  card: {
    id: string
    name: string
    imageUrl: string | null
    rarity: string
    value: number
    game: string
  }
}

interface CaseCardProps {
  cardCase: {
    id: string
    name: string
    slug: string
    description?: string | null
    price: number
    tier: string
    imageUrl?: string | null
    cardCount: number
    _count?: { openings: number }
  }
  topCards?: TopCard[]
  featured?: boolean
}

const tierStyles: Record<string, { border: string; badge: string; glow: string }> = {
  STARTER:   { border: 'border-gray-600/40',   badge: 'bg-gray-500/20 text-gray-400',     glow: '' },
  STANDARD:  { border: 'border-blue-500/30',   badge: 'bg-blue-500/20 text-blue-400',     glow: '' },
  PREMIUM:   { border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-400', glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]' },
  ELITE:     { border: 'border-yellow-400/40', badge: 'bg-yellow-400/20 text-yellow-400', glow: 'hover:shadow-gold-glow' },
  LEGENDARY: { border: 'border-yellow-400/60', badge: 'bg-yellow-400/30 text-yellow-300', glow: 'legendary-glow' },
}

const GAME_EMOJI: Record<string, string> = {
  POKEMON: '⚡', ONE_PIECE: '☠️', MAGIC: '✨', DRAGON_BALL: '🐉',
}

const FAN_SLOTS = [
  { rotate: -14, y: 8  },
  { rotate: -5,  y: 2  },
  { rotate:  5,  y: 2  },
  { rotate:  14, y: 8  },
]

export function CaseCard({ cardCase, topCards = [], featured }: CaseCardProps) {
  const styles = tierStyles[cardCase.tier] ?? tierStyles.STANDARD
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

    <Link
      href={`/open/${cardCase.slug}`}
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-navy-800 overflow-hidden transition-all duration-300',
        'hover:scale-[1.02] hover:bg-navy-700',
        styles.border,
        styles.glow,
        featured && 'col-span-1',
      )}
    >
      {/* Image / Visual area */}
      <div className="relative h-48 bg-gradient-to-b from-navy-700 to-navy-900 flex items-center justify-center overflow-hidden">
        {cardCase.imageUrl ? (
          <Image
            src={cardCase.imageUrl}
            alt={cardCase.name}
            fill
            className="object-cover transition-all duration-500"
            style={{ opacity: hovered && topCards.length > 0 ? 0.15 : 0.7 }}
          />
        ) : (
          <div style={{ opacity: hovered && topCards.length > 0 ? 0 : 1, transition: 'opacity 0.3s ease' }}>
            <CasePlaceholder tier={cardCase.tier} />
          </div>
        )}

        {/* Top cards fan overlay */}
        {topCards.length > 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              background: 'radial-gradient(ellipse at center, rgba(8,13,26,0.7) 0%, rgba(8,13,26,0.95) 100%)',
              pointerEvents: 'none',
            }}
          >
            <p
              className="text-[9px] font-mono tracking-[0.25em] mb-3 flex items-center gap-1.5"
              style={{
                color: 'rgba(251,191,36,0.8)',
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.2s ease 0.05s, transform 0.2s ease 0.05s',
              }}
            >
              <Sparkles size={8} />
              TOP PULLS
              <Sparkles size={8} />
            </p>

            <div className="flex items-end gap-1" style={{ paddingBottom: 8 }}>
              {topCards.slice(0, 4).map(({ card }, i) => {
                const color = getRarityColor(card.rarity)
                const slot = FAN_SLOTS[i] ?? FAN_SLOTS[0]
                const isLegendary = card.rarity === 'LEGENDARY'
                const isEpic = card.rarity === 'EPIC'
                return (
                  <div
                    key={card.id}
                    style={{
                      transform: hovered
                        ? `rotate(${slot.rotate}deg) translateY(${slot.y}px)`
                        : `rotate(${slot.rotate}deg) translateY(${slot.y + 18}px) scale(0.8)`,
                      opacity: hovered ? 1 : 0,
                      transition: `opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)`,
                      transitionDelay: hovered ? `${i * 0.06}s` : '0s',
                      filter: isLegendary
                        ? `drop-shadow(0 0 8px ${color})`
                        : isEpic
                        ? `drop-shadow(0 0 5px ${color})`
                        : `drop-shadow(0 2px 8px rgba(0,0,0,0.8))`,
                    }}
                  >
                    <div style={{
                      width: 54,
                      height: 76,
                      borderRadius: 7,
                      overflow: 'hidden',
                      border: `1.5px solid ${color}80`,
                      boxShadow: `0 0 14px ${color}50, inset 0 0 0 1px ${color}20`,
                      position: 'relative',
                      background: '#080c18',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}80)`, zIndex: 2 }} />
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20,
                          background: `linear-gradient(135deg, ${color}25 0%, #080c18 100%)`,
                        }}>
                          {GAME_EMOJI[card.game] ?? '🃏'}
                        </div>
                      )}
                    </div>
                    <div style={{ width: 54, marginTop: 4, textAlign: 'center' }}>
                      <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{card.name}</p>
                      <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color, marginTop: 1 }}>{formatCurrency(card.value)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tier badge */}
        <div className={cn('absolute top-3 left-3 rarity-badge z-20', styles.badge)}>
          {getTierLabel(cardCase.tier)}
        </div>

        {/* Card count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-xs text-slate-300 z-20">
          <Package size={10} />
          {cardCase.cardCount} cards
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-800 to-transparent z-[5]" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div>
          <h3 className="font-display text-xl tracking-wide text-white group-hover:text-yellow-300 transition-colors">
            {cardCase.name}
          </h3>
          {cardCase.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{cardCase.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Price</span>
            <span className="text-2xl font-display text-yellow-400 text-glow-gold">
              {formatCurrency(cardCase.price)}
            </span>
          </div>

          {cardCase._count && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users size={12} />
              {cardCase._count.openings.toLocaleString()} opens
            </div>
          )}
        </div>

        <div className="btn-gold w-full py-2.5 rounded-xl text-center font-display tracking-wider text-sm flex items-center justify-center gap-2">
          Open Case
          <ChevronRight size={16} />
        </div>
      </div>
    </Link>
    </div>
  )
}

function CasePlaceholder({ tier }: { tier: string }) {
  const emojis: Record<string, string> = {
    STARTER: '📦', STANDARD: '🎴', PREMIUM: '💎', ELITE: '👑', LEGENDARY: '⚡'
  }
  const sizes: Record<string, string> = {
    STARTER: 'text-5xl', STANDARD: 'text-6xl', PREMIUM: 'text-6xl', ELITE: 'text-7xl', LEGENDARY: 'text-8xl'
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <span className={cn('select-none', sizes[tier] ?? 'text-6xl')}>
        {emojis[tier] ?? '🎴'}
      </span>
      {tier === 'LEGENDARY' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-yellow-400 animate-ping"
              style={{
                left: `${10 + i * 11}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.25}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
