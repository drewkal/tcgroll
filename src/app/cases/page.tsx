// src/app/cases/page.tsx
import { prisma } from '@/lib/prisma'
import { CaseCard } from '@/components/cards/case-card'
import { Package } from 'lucide-react'

async function getAllCases() {
  return prisma.cardCase.findMany({
    where: { active: true },
    include: { _count: { select: { openings: true } } },
    orderBy: { price: 'asc' },
  })
}

const TIERS = ['ALL', 'STARTER', 'STANDARD', 'PREMIUM', 'ELITE', 'LEGENDARY']

export default async function CasesPage({
  searchParams,
}: {
  searchParams: { tier?: string }
}) {
  const allCases = await getAllCases()
  const selectedTier = searchParams.tier?.toUpperCase() ?? 'ALL'

  const filtered = selectedTier === 'ALL'
    ? allCases
    : allCases.filter(c => c.tier === selectedTier)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— MARKETPLACE</p>
        <h1 className="font-display text-6xl tracking-wide text-white mb-4">BROWSE CASES</h1>
        <p className="text-slate-400 max-w-xl">
          Choose from {allCases.length} unique cases spanning multiple rarity tiers.
          Each case has carefully tuned drop rates for fair play.
        </p>
      </div>

      {/* Tier filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {TIERS.map(tier => (
          <a
            key={tier}
            href={tier === 'ALL' ? '/cases' : `/cases?tier=${tier.toLowerCase()}`}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              selectedTier === tier
                ? 'bg-yellow-400 text-black font-bold'
                : 'bg-navy-800 text-slate-400 border border-white/10 hover:border-yellow-400/30 hover:text-yellow-400'
            }`}
          >
            {tier}
          </a>
        ))}
      </div>

      {/* Cases grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-32 text-slate-500">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-display text-2xl">No cases found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(cardCase => (
            <CaseCard key={cardCase.id} cardCase={cardCase} />
          ))}
        </div>
      )}
    </div>
  )
}
