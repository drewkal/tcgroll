// src/app/cases/[game]/page.tsx
export const revalidate = 60
import { prisma } from '@/lib/prisma'
import { CaseCard } from '@/components/cards/case-card'
import { getGame } from '@/lib/games'
import { notFound } from 'next/navigation'
import { Package, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game: gameSlug } = await params
  const game = getGame(gameSlug)
  if (!game) return {}
  const title = `${game.label} Cases | TCGRoll`
  const description = `Open virtual ${game.label} card cases on TCGRoll. ${game.description}`
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

const TIERS = ['ALL', 'STARTER', 'STANDARD', 'PREMIUM', 'ELITE', 'LEGENDARY']

export default async function GameCasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>
  searchParams: Promise<{ tier?: string }>
}) {
  const { game: gameSlug } = await params
  const { tier } = await searchParams

  const game = getGame(gameSlug)
  if (!game) notFound()

  const allCases = await prisma.cardCase.findMany({
    where: { active: true, game: game.enum },
    include: {
      _count: { select: { openings: true } },
      caseCards: {
        include: { card: true },
        orderBy: { card: { value: 'desc' } },
        take: 4,
      },
    },
    orderBy: { price: 'asc' },
  })

  const selectedTier = tier?.toUpperCase() ?? 'ALL'
  const filtered = selectedTier === 'ALL'
    ? allCases
    : allCases.filter(c => c.tier === selectedTier)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/cases" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> All Games
      </Link>

      {/* Header */}
      <div className={`relative rounded-3xl bg-gradient-to-br ${game.bg} border ${game.border} p-10 mb-12 overflow-hidden`}>
        <div className="absolute top-4 right-6 text-8xl opacity-20 select-none">{game.emoji}</div>
        <div className="relative">
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: game.color }}>— {game.emoji} CARD GAME</p>
          <h1 className="font-display text-6xl tracking-wide text-white mb-3">{game.label.toUpperCase()}</h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">{game.description}</p>
          <div className="mt-4 text-xs font-mono text-slate-500">
            {allCases.length} case{allCases.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </div>

      {/* Tier filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {TIERS.map(t => (
          <a
            key={t}
            href={t === 'ALL' ? `/cases/${gameSlug}` : `/cases/${gameSlug}?tier=${t.toLowerCase()}`}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              selectedTier === t
                ? 'text-black font-bold'
                : 'bg-navy-800 text-slate-400 border border-white/10 hover:border-white/20 hover:text-white'
            }`}
            style={selectedTier === t ? { backgroundColor: game.color, borderColor: game.color } : {}}
          >
            {t}
          </a>
        ))}
      </div>

      {/* Cases grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-32 text-slate-500">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-2xl mb-2">No cases yet</p>
          <p className="text-sm">Check back soon — we're adding more {game.label} cases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(cardCase => (
            <CaseCard key={cardCase.id} cardCase={cardCase} topCards={cardCase.caseCards as any} />
          ))}
        </div>
      )}
    </div>
  )
}
