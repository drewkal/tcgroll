// src/app/page.tsx
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CaseCard } from '@/components/cards/case-card'
import { HeroVisual } from '@/components/hero-visual'
import { GAMES, GAME_SLUGS } from '@/lib/games'
import { ChevronRight, Zap, Shield, TrendingUp, Package } from 'lucide-react'

async function getFeaturedCases() {
  return prisma.cardCase.findMany({
    where: { active: true, featured: true },
    include: { _count: { select: { openings: true } } },
    orderBy: { price: 'asc' },
    take: 4,
  })
}

async function getCasesByGame() {
  return prisma.cardCase.findMany({
    where: { active: true },
    include: { _count: { select: { openings: true } } },
    orderBy: { price: 'asc' },
  })
}

async function getHeroCards() {
  return prisma.card.findMany({
    orderBy: { value: 'desc' },
    take: 3,
    select: { id: true, name: true, imageUrl: true, rarity: true, game: true },
  })
}

async function getSiteStats() {
  const [totalOpenings, totalUsers] = await Promise.all([
    prisma.caseOpening.count(),
    prisma.user.count(),
  ])
  return { totalOpenings, totalUsers }
}

export default async function HomePage() {
  const [featuredCases, allCases, stats, heroCards] = await Promise.all([
    getFeaturedCases(),
    getCasesByGame(),
    getSiteStats(),
    getHeroCards(),
  ])

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-yellow-400/5 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 rounded-full bg-purple-500/4 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-mono mb-8 animate-bounce-slow">
            <Zap size={14} className="fill-yellow-400" />
            Pokémon · One Piece · Magic · Dragon Ball
          </div>

          <h1 className="font-display text-7xl md:text-9xl tracking-wider text-white mb-4 leading-none">
            OPEN. COLLECT.{' '}
            <span className="text-glow-gold text-yellow-400">DOMINATE.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Roll virtual TCG cases with real rarity odds. Pull legendary holos,
            build your dream collection, and sell duplicates for balance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/cases" className="btn-gold px-8 py-4 rounded-xl text-lg font-display tracking-widest flex items-center gap-2 group">
              Browse Cases
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/register" className="px-8 py-4 rounded-xl text-lg font-display tracking-widest border border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2">
              Start Free — 🪙 500 Bonus
              <Zap size={16} className="text-yellow-400" />
            </Link>
          </div>

          <HeroVisual cards={heroCards as any} />

          <div className="flex items-center justify-center gap-12 mt-8">
            {[
              { label: 'Cases Opened', value: stats.totalOpenings.toLocaleString() },
              { label: 'Trainers', value: stats.totalUsers.toLocaleString() },
              { label: 'Card Games', value: '4' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl md:text-4xl text-yellow-400 text-glow-gold">{value}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Sections */}
      <section className="px-4 py-20 max-w-7xl mx-auto space-y-16">
        <div>
          <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— BROWSE BY GAME</p>
          <h2 className="font-display text-5xl tracking-wide text-white">CHOOSE YOUR GAME</h2>
        </div>

        {GAME_SLUGS.map(slug => {
          const game = GAMES[slug]
          const gameCases = allCases.filter((c: typeof allCases[0]) => c.game === game.enum).slice(0, 4)

          return (
            <div key={slug}>
              {/* Game header */}
              <div className={`relative rounded-2xl bg-gradient-to-br ${game.bg} border ${game.border} px-8 py-6 mb-6 flex items-center justify-between overflow-hidden`}>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">{game.emoji}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{game.emoji}</span>
                    <h3 className="font-display text-3xl text-white tracking-wide">{game.label.toUpperCase()}</h3>
                  </div>
                  <p className="text-slate-400 text-sm max-w-md">{game.description}</p>
                </div>
                <Link
                  href={`/cases/${slug}`}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-display tracking-wider text-sm transition-all flex-shrink-0"
                  style={{ backgroundColor: game.color + '20', color: game.color, border: `1px solid ${game.color}40` }}
                >
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              {gameCases.length === 0 ? (
                <div className="text-center py-12 text-slate-500 glass rounded-2xl border border-white/5">
                  <span className="text-4xl block mb-3">{game.emoji}</span>
                  <p className="font-display text-xl">Coming Soon</p>
                  <p className="text-sm mt-1">{game.label} cases are on the way.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {gameCases.map(cardCase => (
                      <CaseCard key={cardCase.id} cardCase={cardCase} />
                    ))}
                  </div>
                  <div className="mt-4 text-right">
                    <Link href={`/cases/${slug}`} className="text-sm font-mono transition-colors flex items-center gap-1 justify-end" style={{ color: game.color }}>
                      See all {game.label} cases <ChevronRight size={13} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </section>

      {/* Featured Cases */}
      {featuredCases.length > 0 && (
        <section className="px-4 py-20 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— FEATURED</p>
              <h2 className="font-display text-5xl tracking-wide text-white">FEATURED CASES</h2>
            </div>
            <Link href="/cases" className="text-slate-400 hover:text-yellow-400 transition-colors flex items-center gap-1 text-sm font-mono">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCases.map(cardCase => (
              <CaseCard key={cardCase.id} cardCase={cardCase} featured />
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— SIMPLE AS</p>
            <h2 className="font-display text-5xl tracking-wide text-white">HOW IT WORKS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Package size={32} className="text-yellow-400" />, step: '01', title: 'Choose Your Case', desc: 'Browse cases across Pokémon, One Piece, Magic, and Dragon Ball. Each has unique drop rates.' },
              { icon: <Zap size={32} className="text-yellow-400" />, step: '02', title: 'Roll & Reveal', desc: 'Open your case and watch cards reveal on a cinematic reel. Every roll uses provably fair weighted randomness.' },
              { icon: <TrendingUp size={32} className="text-yellow-400" />, step: '03', title: 'Collect or Sell', desc: 'Keep your pulls or instantly sell them for balance. Withdraw physical cards at any time.' },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="relative glass rounded-2xl p-8 border border-white/5 hover:border-yellow-400/20 transition-colors">
                <div className="absolute top-6 right-6 font-display text-6xl text-white/5">{step}</div>
                <div className="mb-5">{icon}</div>
                <h3 className="font-display text-2xl tracking-wide text-white mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl border border-yellow-400/20 p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/5 to-transparent" />
          <div className="relative">
            <Shield size={48} className="text-yellow-400 mx-auto mb-6" />
            <h2 className="font-display text-5xl tracking-wide text-white mb-4">READY TO ROLL?</h2>
            <p className="text-slate-400 mb-8">Create a free account and get 🪙 500 bonus tokens to start opening cases immediately.</p>
            <Link href="/register" className="btn-gold inline-flex items-center gap-2 px-10 py-4 rounded-xl font-display tracking-widest text-lg">
              Create Free Account
              <Zap size={18} className="fill-black" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
