// src/components/cards/case-card.tsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, getTierLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Package, Users, ChevronRight } from 'lucide-react'

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
  featured?: boolean
}

const tierStyles: Record<string, { border: string; badge: string; glow: string }> = {
  STARTER:   { border: 'border-gray-600/40',   badge: 'bg-gray-500/20 text-gray-400',     glow: '' },
  STANDARD:  { border: 'border-blue-500/30',   badge: 'bg-blue-500/20 text-blue-400',     glow: '' },
  PREMIUM:   { border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-400', glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]' },
  ELITE:     { border: 'border-yellow-400/40', badge: 'bg-yellow-400/20 text-yellow-400', glow: 'hover:shadow-gold-glow' },
  LEGENDARY: { border: 'border-yellow-400/60', badge: 'bg-yellow-400/30 text-yellow-300', glow: 'legendary-glow' },
}

export function CaseCard({ cardCase, featured }: CaseCardProps) {
  const styles = tierStyles[cardCase.tier] ?? tierStyles.STANDARD

  return (
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
          <Image src={cardCase.imageUrl} alt={cardCase.name} fill className="object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
        ) : (
          <CasePlaceholder tier={cardCase.tier} />
        )}

        {/* Tier badge */}
        <div className={cn('absolute top-3 left-3 rarity-badge', styles.badge)}>
          {getTierLabel(cardCase.tier)}
        </div>

        {/* Card count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-xs text-slate-300">
          <Package size={10} />
          {cardCase.cardCount} cards
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-800 to-transparent" />
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
