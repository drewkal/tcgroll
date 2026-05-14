import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getRarityColor } from '@/lib/opening-engine'
import { formatCurrency } from '@/lib/utils'
import { GAMES, GAME_SLUGS } from '@/lib/games'
import Link from 'next/link'
import { ChevronLeft, Package, TrendingUp, Zap } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const card = await prisma.card.findUnique({ where: { id }, select: { name: true, rarity: true, game: true, value: true, imageUrl: true } })
  if (!card) return {}

  const gameLabel = GAME_SLUGS.map(s => GAMES[s]).find(g => g.enum === card.game)?.label ?? card.game
  const title = `${card.name} | ${gameLabel} Card | TCGRoll`
  const description = `${card.name} is a ${card.rarity.toLowerCase()} ${gameLabel} card worth ${formatCurrency(card.value)}. See which TCGRoll cases to open for the best chance of pulling it.`

  return {
    title,
    description,
    openGraph: { title, description, images: card.imageUrl ? [card.imageUrl] : [] },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      caseCards: {
        where: { case: { active: true } },
        include: {
          case: {
            include: {
              caseCards: { select: { dropRate: true } },
              _count: { select: { openings: true } },
            },
          },
        },
      },
      _count: { select: { openingCards: true } },
    },
  })

  if (!card) notFound()

  const color = getRarityColor(card.rarity)
  const gameSlug = GAME_SLUGS.find(s => GAMES[s].enum === card.game)
  const game = gameSlug ? GAMES[gameSlug] : null

  // Calculate effective pull probability per case
  const casesWithOdds = card.caseCards
    .filter(cc => cc.case)
    .map(cc => {
      const totalWeight = cc.case.caseCards.reduce((s: number, c: { dropRate: number }) => s + c.dropRate, 0)
      const probability = totalWeight > 0 ? (cc.dropRate / totalWeight) * 100 : 0
      return { ...cc.case, probability, dropRate: cc.dropRate }
    })
    .sort((a: { probability: number }, b: { probability: number }) => b.probability - a.probability)

  const bestCase = casesWithOdds[0]

  // Related cards
  const related = await prisma.card.findMany({
    where: { game: card.game, rarity: card.rarity, NOT: { id: card.id } },
    orderBy: { value: 'desc' },
    take: 6,
    select: { id: true, name: true, imageUrl: true, rarity: true, value: true, game: true },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    description: `${card.rarity} ${game?.label ?? card.game} card on TCGRoll`,
    image: card.imageUrl ?? undefined,
    offers: {
      '@type': 'Offer',
      price: (card.value / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">

        {/* Back */}
        <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
          <Link href="/cards" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
            <ChevronLeft size={14} /> Card Library
          </Link>
          {gameSlug && (
            <>
              <span>/</span>
              <Link href={`/cards?game=${gameSlug}`} className="hover:text-yellow-400 transition-colors" style={{ color: game?.color }}>
                {game?.label}
              </Link>
            </>
          )}
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* Card image */}
          <div className="flex justify-center md:justify-start">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: 260,
                aspectRatio: '3/4',
                border: `2px solid ${color}60`,
                boxShadow: `0 0 40px ${color}30, 0 20px 60px rgba(0,0,0,0.8)`,
                background: `linear-gradient(135deg, ${color}15 0%, #080c18 100%)`,
              }}
            >
              <div className="absolute top-0 inset-x-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {game?.emoji ?? '🃏'}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {game && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full border" style={{ color: game.color, borderColor: game.color + '40', backgroundColor: game.color + '15' }}>
                    {game.emoji} {game.label}
                  </span>
                )}
                <span className="text-xs font-mono px-2.5 py-1 rounded-full border" style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}>
                  {card.rarity}
                </span>
                {card.setName && (
                  <span className="text-xs font-mono text-slate-500 px-2.5 py-1 rounded-full border border-white/10">
                    {card.setName}
                  </span>
                )}
              </div>
              <h1 className="font-display text-5xl md:text-6xl text-white tracking-wide leading-tight">{card.name}</h1>
            </div>

            {/* Value */}
            <div className="flex items-end gap-4">
              <div>
                <p className="text-xs font-mono text-slate-500 tracking-widest mb-1">MARKET VALUE</p>
                <p className="font-display text-4xl text-yellow-400 text-glow-gold">{formatCurrency(card.value)}</p>
                <p className="text-xs text-slate-500 mt-1">≈ ${(card.value / 100).toFixed(2)} USD</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Times Pulled', value: card._count.openingCards.toLocaleString() },
                { label: 'In Cases', value: casesWithOdds.length.toString() },
                { label: 'Best Odds', value: bestCase ? `${bestCase.probability.toFixed(2)}%` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-xl p-3 border border-white/5 text-center">
                  <p className="font-display text-xl text-white">{value}</p>
                  <p className="text-[10px] font-mono text-slate-500 tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Best case CTA */}
            {bestCase && (
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ borderColor: color + '30', backgroundColor: color + '08' }}
              >
                <div>
                  <p className="text-xs font-mono text-slate-400 tracking-wider mb-0.5">BEST CASE TO OPEN</p>
                  <p className="text-white font-display text-lg">{bestCase.name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color }}>{bestCase.probability.toFixed(2)}% pull chance</p>
                </div>
                <Link
                  href={`/open/${bestCase.slug}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display tracking-wider text-sm transition-all"
                  style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}
                >
                  Open <Zap size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Cases containing this card */}
        {casesWithOdds.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-3xl text-white tracking-wide">FOUND IN {casesWithOdds.length} CASE{casesWithOdds.length !== 1 ? 'S' : ''}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {casesWithOdds.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/open/${c.slug}`}
                  className="glass rounded-xl border border-white/5 p-4 flex items-center gap-4 hover:border-yellow-400/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-slate-400 group-hover:text-yellow-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover:text-yellow-300 transition-colors">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono" style={{ color }}>{c.probability.toFixed(2)}% chance</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs font-mono text-slate-500">{formatCurrency(c.price)}</span>
                    </div>
                  </div>
                  <div
                    className="text-xs font-mono px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: color + '15', color, border: `1px solid ${color}30` }}
                  >
                    {c.tier}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related cards */}
        {related.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-white tracking-wide">MORE {card.rarity} CARDS</h2>
              <Link href={`/cards?game=${gameSlug}&rarity=${card.rarity.toLowerCase()}`} className="text-sm font-mono text-slate-400 hover:text-yellow-400 transition-colors flex items-center gap-1">
                View all <ChevronLeft size={12} className="rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {related.map(r => {
                const rColor = getRarityColor(r.rarity)
                return (
                  <Link
                    key={r.id}
                    href={`/cards/${r.id}`}
                    className="group rounded-xl overflow-hidden border transition-all hover:scale-[1.04]"
                    style={{ borderColor: rColor + '40', background: '#0f1629' }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, ${rColor}15, #080c18)` }}>
                      <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: rColor }} />
                      {r.imageUrl
                        ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">{game?.emoji ?? '🃏'}</div>
                      }
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-white leading-tight line-clamp-2 group-hover:text-yellow-300 transition-colors">{r.name}</p>
                      <p className="text-[10px] font-mono mt-1" style={{ color: rColor }}>{formatCurrency(r.value)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
