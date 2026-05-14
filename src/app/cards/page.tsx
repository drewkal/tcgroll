export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getRarityColor } from '@/lib/opening-engine'
import { formatCurrency } from '@/lib/utils'
import { GAMES, GAME_SLUGS } from '@/lib/games'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Card Library',
  description: 'Browse every card available on TCGRoll. See rarity, value, and which cases to open for the best chance of pulling each card.',
  openGraph: { title: 'Card Library | TCGRoll', description: 'Every card, its rarity, value, and pull rates.' },
}

const RARITIES = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']
const GAME_ENUM: Record<string, string> = {
  pokemon: 'POKEMON', 'one-piece': 'ONE_PIECE', magic: 'MAGIC', 'dragon-ball': 'DRAGON_BALL',
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; rarity?: string }>
}) {
  const { game: gameSlug, rarity } = await searchParams
  const gameEnum = gameSlug ? GAME_ENUM[gameSlug] : undefined
  const rarityFilter = rarity?.toUpperCase()

  const cards = await prisma.card.findMany({
    where: {
      ...(gameEnum ? { game: gameEnum as any } : {}),
      ...(rarityFilter && RARITIES.includes(rarityFilter) ? { rarity: rarityFilter as any } : {}),
    },
    include: { _count: { select: { caseCards: true, openingCards: true } } },
    orderBy: [{ value: 'desc' }],
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div>
        <p className="text-yellow-400 font-mono text-xs tracking-widest mb-2">— DISCOVER</p>
        <h1 className="font-display text-6xl tracking-wide text-white mb-3">CARD LIBRARY</h1>
        <p className="text-slate-400 max-w-xl text-sm">
          Every card available across all TCGRoll cases. Click any card to see pull rates and which cases to open.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Game tabs */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cards"
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
              !gameSlug ? 'bg-yellow-400 text-black border-yellow-400 font-bold' : 'bg-transparent text-slate-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            All Games
          </Link>
          {GAME_SLUGS.map(slug => {
            const game = GAMES[slug]
            const active = gameSlug === slug
            return (
              <Link
                key={slug}
                href={`/cards?game=${slug}${rarityFilter ? `&rarity=${rarity}` : ''}`}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all border ${active ? 'font-bold' : 'bg-transparent text-slate-400 border-white/10 hover:text-white hover:border-white/20'}`}
                style={active ? { backgroundColor: game.color, color: '#000', borderColor: game.color } : {}}
              >
                {game.emoji} {game.label}
              </Link>
            )
          })}
        </div>

        {/* Rarity filter */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={gameSlug ? `/cards?game=${gameSlug}` : '/cards'}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all border ${!rarityFilter ? 'bg-white/10 text-white border-white/20' : 'text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10'}`}
          >
            All Rarities
          </Link>
          {RARITIES.map(r => {
            const color = getRarityColor(r)
            const active = rarityFilter === r
            return (
              <Link
                key={r}
                href={`/cards?${gameSlug ? `game=${gameSlug}&` : ''}rarity=${r.toLowerCase()}`}
                className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all border"
                style={{
                  backgroundColor: active ? color + '25' : 'transparent',
                  color: active ? color : '#64748b',
                  borderColor: active ? color + '60' : 'rgba(255,255,255,0.05)',
                }}
              >
                {r}
              </Link>
            )
          })}
        </div>
      </div>

      <p className="text-xs font-mono text-slate-500">{cards.length.toLocaleString()} cards</p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {cards.map(card => {
          const color = getRarityColor(card.rarity)
          return (
            <Link
              key={card.id}
              href={`/cards/${card.id}`}
              className="group flex flex-col rounded-xl overflow-hidden border transition-all hover:scale-[1.03] hover:z-10"
              style={{ borderColor: color + '40', background: '#0f1629' }}
            >
              {/* Card image */}
              <div
                className="relative w-full"
                style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, ${color}15 0%, #080c18 100%)` }}
              >
                <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: color }} />
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {GAME_SLUGS.find(s => GAMES[s].enum === card.game) ? GAMES[GAME_SLUGS.find(s => GAMES[s].enum === card.game)!].emoji : '🃏'}
                  </div>
                )}
                <div
                  className="absolute bottom-1.5 left-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: color + '30', color, border: `1px solid ${color}50` }}
                >
                  {card.rarity}
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 flex flex-col gap-1">
                <p className="text-white text-xs font-medium leading-tight line-clamp-2 group-hover:text-yellow-300 transition-colors">{card.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-xs" style={{ color }}>{formatCurrency(card.value)}</span>
                  {card._count.caseCards > 0 && (
                    <span className="text-[10px] font-mono text-slate-500">{card._count.caseCards} case{card._count.caseCards !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-24 text-slate-500">
          <p className="font-display text-2xl mb-2">No cards found</p>
          <p className="text-sm">Try a different filter.</p>
        </div>
      )}
    </div>
  )
}
