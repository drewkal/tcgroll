// src/app/cases/page.tsx
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { CaseCard } from '@/components/cards/case-card'
import { GAMES, GAME_SLUGS } from '@/lib/games'
import { Package, ChevronRight } from 'lucide-react'
import Link from 'next/link'

async function getCasesByGame() {
  const cases = await prisma.cardCase.findMany({
    where: { active: true },
    include: { _count: { select: { openings: true } } },
    orderBy: { price: 'asc' },
  })
  return cases
}

export default async function CasesPage() {
  const allCases = await getCasesByGame()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Header */}
      <div>
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— MARKETPLACE</p>
        <h1 className="font-display text-6xl tracking-wide text-white mb-4">BROWSE CASES</h1>
        <p className="text-slate-400 max-w-xl">
          Choose your game and start opening cases. Real rarity odds, instant results.
        </p>
      </div>

      {/* Game sections */}
      {GAME_SLUGS.map(slug => {
        const game = GAMES[slug]
        const gameCases = allCases.filter(c => c.game === game.enum)
        const preview = gameCases.slice(0, 4)

        return (
          <section key={slug}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{game.emoji}</span>
                <div>
                  <h2 className="font-display text-3xl text-white tracking-wide">{game.label.toUpperCase()}</h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{gameCases.length} case{gameCases.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link
                href={`/cases/${slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-mono transition-all hover:text-white"
                style={{ borderColor: game.color + '40', color: game.color }}
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {preview.length === 0 ? (
              <div className={`rounded-2xl bg-gradient-to-br ${game.bg} border ${game.border} p-10 text-center`}>
                <span className="text-4xl mb-3 block">{game.emoji}</span>
                <p className="text-slate-500 text-sm">Coming soon — {game.label} cases are on the way.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {preview.map(cardCase => (
                  <CaseCard key={cardCase.id} cardCase={cardCase} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
