// src/app/page.tsx
export const revalidate = 60
import type { Metadata } from 'next'
export const metadata: Metadata = {
  alternates: { canonical: 'https://tcgroll.com/' },
}
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { CaseCard } from '@/components/cards/case-card'
import { GAMES, GAME_SLUGS } from '@/lib/games'
import { GameCardVisual } from '@/components/game-card-visual'
import { ChevronRight, Zap, Shield, TrendingUp, Package } from 'lucide-react'
import { getSettings } from '@/lib/settings'
import { Logo } from '@/components/logo'
import { RecentPullsTicker } from '@/components/recent-pulls-ticker'

const TOP_CARDS_INCLUDE = {
  caseCards: {
    include: { card: { select: { id: true, name: true, imageUrl: true, rarity: true, value: true, game: true } } },
    orderBy: { card: { value: 'desc' as const } },
    take: 4,
  },
}

async function getFeaturedCases() {
  return prisma.cardCase.findMany({
    where: { active: true, featured: true },
    include: { _count: { select: { openings: true } }, ...TOP_CARDS_INCLUDE },
    orderBy: { price: 'asc' },
    take: 4,
  })
}

async function getCasesByGame() {
  return prisma.cardCase.findMany({
    where: { active: true },
    include: { _count: { select: { openings: true } }, ...TOP_CARDS_INCLUDE },
    orderBy: { price: 'asc' },
  })
}

async function getGameCards() {
  const games = ['POKEMON', 'ONE_PIECE', 'MAGIC', 'DRAGON_BALL'] as const
  const results = await Promise.all(
    games.map(game => prisma.card.findMany({
      where: { game },
      orderBy: { value: 'desc' },
      take: 3,
      select: { id: true, name: true, imageUrl: true, rarity: true, game: true },
    }))
  )
  return Object.fromEntries(games.map((g, i) => [g, results[i]])) as Record<string, { id: string; name: string; imageUrl: string | null; rarity: string; game: string }[]>
}

async function getSiteStats() {
  const [totalOpenings, totalUsers] = await Promise.all([
    prisma.caseOpening.count(),
    prisma.user.count(),
  ])
  return { totalOpenings, totalUsers }
}

export default async function HomePage() {
  const [featuredCases, allCases, stats, gameCards, settings] = await Promise.all([
    getFeaturedCases(),
    getCasesByGame(),
    getSiteStats(),
    getGameCards(),
    getSettings(['hero_banner', 'logo_header']),
  ])

  return (
    <div className="min-h-screen">

      <RecentPullsTicker />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-2 pb-16 px-4">
        {/* Hero background image */}
        {settings.hero_banner && (
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src={settings.hero_banner}
              alt=""
              fill
              className="object-cover object-center opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080d1a]/40 via-[#080d1a]/60 to-[#080d1a]" />
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-yellow-400/5 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 rounded-full bg-purple-500/4 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            {settings.logo_header
              ? <Image src={settings.logo_header} alt="TCGRoll" width={2000} height={280} className="h-[160px] sm:h-[220px] md:h-[280px] w-auto object-contain" unoptimized />
              : <Logo size="hero" />}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs sm:text-sm font-mono mb-3 animate-bounce-slow">
            <Zap size={12} className="fill-yellow-400" />
            Pokémon · One Piece · Magic · Dragon Ball
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-9xl tracking-wider text-white mb-3 leading-none">
            CHASE THE{' '}
            <span className="text-glow-gold text-yellow-400">GRAIL.</span>
          </h1>

          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto mb-5 font-light leading-relaxed px-2">
            Open TCG cases with real rarity odds. Win real cards shipped straight to your door —
            pull legendary holos, build your collection, and sell duplicates for balance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 px-2">
            {[
              { icon: '📦', text: 'Physical cards shipped to you' },
              { icon: '🎯', text: 'Published drop rates' },
              { icon: '⚡', text: 'Instant digital reveal' },
            ].map(({ icon, text }) => (
              <div key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm font-mono">
                <span>{icon}</span>
                {text}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto relative btn-gold px-8 py-4 rounded-xl text-base sm:text-lg font-display tracking-widest flex items-center justify-center gap-2 shadow-gold-glow animate-glow-pulse">
              <Zap size={18} className="fill-black" />
              Start Free — 🪙 750 Bonus
            </Link>
            <Link href="/cases" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base sm:text-lg font-display tracking-widest border border-white/15 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group">
              Browse Cases
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform text-slate-400" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-6 sm:mt-8">
            {[
              { label: 'Cases Opened', value: stats.totalOpenings.toLocaleString() },
              { label: 'Trainers', value: stats.totalUsers.toLocaleString() },
              { label: 'Card Games', value: '4' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl text-yellow-400 text-glow-gold">{value}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Sections */}
      <section className="px-4 py-12 md:py-20 max-w-7xl mx-auto space-y-12 md:space-y-16">
        <div>
          <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— BROWSE BY GAME</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-wide text-white">CHOOSE YOUR GAME</h2>
        </div>

        {GAME_SLUGS.map(slug => {
          const game = GAMES[slug]
          const gameCases = allCases.filter((c: typeof allCases[0]) => c.game === game.enum).slice(0, 4)

          return (
            <div key={slug}>
              {/* Floating cards centered above header */}
              <div className="flex justify-center relative z-10 mb-[-70px]">
                <GameCardVisual cards={gameCards[game.enum] ?? []} color={game.color} />
              </div>

              {/* Game header */}
              <div className={`relative rounded-2xl bg-gradient-to-br ${game.bg} border ${game.border} px-5 md:px-8 pt-20 md:pt-24 pb-5 md:pb-6 mb-6 flex items-center justify-between`}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl md:text-2xl">{game.emoji}</span>
                    <h3 className="font-display text-2xl md:text-3xl text-white tracking-wide">{game.label.toUpperCase()}</h3>
                  </div>
                  <p className="text-slate-400 text-xs md:text-sm max-w-md">{game.description}</p>
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
                    {gameCases.map((cardCase: typeof allCases[0]) => (
                      <CaseCard key={cardCase.id} cardCase={cardCase} topCards={(cardCase as any).caseCards} />
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
        <section className="px-4 py-12 md:py-20 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— FEATURED</p>
              <h2 className="font-display text-3xl md:text-5xl tracking-wide text-white">FEATURED CASES</h2>
            </div>
            <Link href="/cases" className="text-slate-400 hover:text-yellow-400 transition-colors flex items-center gap-1 text-sm font-mono">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCases.map((cardCase: typeof featuredCases[0]) => (
              <CaseCard key={cardCase.id} cardCase={cardCase} topCards={(cardCase as any).caseCards} featured />
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— SIMPLE AS</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-wide text-white">HOW IT WORKS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Package size={32} className="text-yellow-400" />, step: '01', title: 'Choose Your Case', desc: 'Browse cases across Pokémon, One Piece, Magic, and Dragon Ball. Each has unique drop rates.' },
              { icon: <Zap size={32} className="text-yellow-400" />, step: '02', title: 'Roll & Reveal', desc: 'Open your case and watch cards reveal on a cinematic reel. Every roll uses provably fair weighted randomness — drop rates are published and verifiable.' },
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
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl border border-yellow-400/20 p-8 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/5 to-transparent" />
          <div className="relative">
            <Shield size={40} className="text-yellow-400 mx-auto mb-4 md:mb-6 md:w-12 md:h-12" />
            <h2 className="font-display text-3xl md:text-5xl tracking-wide text-white mb-3 md:mb-4">READY TO ROLL?</h2>
            <p className="text-slate-400 mb-8">Create a free account, verify your email, and get 🪙 750 free tokens to start opening cases immediately.</p>
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
