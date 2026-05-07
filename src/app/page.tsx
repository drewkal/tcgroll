// src/app/page.tsx
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CaseCard } from '@/components/cards/case-card'
import { ChevronRight, Zap, Shield, TrendingUp, Package } from 'lucide-react'

async function getFeaturedCases() {
  return prisma.cardCase.findMany({
    where: { active: true, featured: true },
    include: { _count: { select: { openings: true } } },
    orderBy: { price: 'asc' },
    take: 4,
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
  const [featuredCases, stats] = await Promise.all([getFeaturedCases(), getSiteStats()])

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-yellow-400/5 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 rounded-full bg-purple-500/4 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-mono mb-8 animate-bounce-slow">
            <Zap size={14} className="fill-yellow-400" />
            The #1 Pokémon TCG Case Opening Platform
          </div>

          {/* Headline */}
          <h1 className="font-display text-7xl md:text-9xl tracking-wider text-white mb-4 leading-none">
            OPEN. COLLECT.{' '}
            <span className="text-glow-gold text-yellow-400">DOMINATE.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Roll virtual Pokémon card cases with real rarity odds. Pull legendary holos,
            build your dream collection, and sell duplicates for balance.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cases"
              className="btn-gold px-8 py-4 rounded-xl text-lg font-display tracking-widest flex items-center gap-2 group"
            >
              Browse Cases
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl text-lg font-display tracking-widest border border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
            >
              Start Free — $5 Bonus
              <Zap size={16} className="text-yellow-400" />
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-12 mt-20">
            {[
              { label: 'Cases Opened', value: stats.totalOpenings.toLocaleString() },
              { label: 'Trainers', value: stats.totalUsers.toLocaleString() },
              { label: 'Unique Cards', value: '200+' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl md:text-4xl text-yellow-400 text-glow-gold">{value}</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cases */}
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

      {/* How It Works */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— SIMPLE AS</p>
            <h2 className="font-display text-5xl tracking-wide text-white">HOW IT WORKS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Package size={32} className="text-yellow-400" />,
                step: '01',
                title: 'Choose Your Case',
                desc: 'Browse our selection of cases ranging from Starter packs to Legendary Vaults. Each case has unique drop rates and card pools.',
              },
              {
                icon: <Zap size={32} className="text-yellow-400" />,
                step: '02',
                title: 'Roll & Reveal',
                desc: 'Open your case and watch cards reveal in a cinematic animation. Every roll uses provably fair weighted randomness.',
              },
              {
                icon: <TrendingUp size={32} className="text-yellow-400" />,
                step: '03',
                title: 'Collect or Sell',
                desc: 'Keep your pulls in your collection or instantly sell them back for balance to open more cases.',
              },
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

      {/* Rarity Guide */}
      <section className="px-4 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— RARITY TIERS</p>
          <h2 className="font-display text-5xl tracking-wide text-white">CARD RARITIES</h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { rarity: 'COMMON', color: '#9ca3af', desc: 'Base set staples', pct: '~60%' },
            { rarity: 'UNCOMMON', color: '#22c55e', desc: 'Holo variants', pct: '~25%' },
            { rarity: 'RARE', color: '#3b82f6', desc: 'V & ex cards', pct: '~10%' },
            { rarity: 'EPIC', color: '#a855f7', desc: 'VMAX & Special Art', pct: '~4%' },
            { rarity: 'LEGENDARY', color: '#f59e0b', desc: 'Alt Art & Secret Rare', pct: '~1%' },
          ].map(({ rarity, color, desc, pct }) => (
            <div
              key={rarity}
              className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl glass border"
              style={{ borderColor: `${color}30` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
              <span className="font-display text-lg tracking-wider" style={{ color }}>{rarity}</span>
              <span className="text-xs text-slate-500">{desc}</span>
              <span className="font-mono text-xs" style={{ color }}>{pct}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl border border-yellow-400/20 p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/5 to-transparent" />
          <div className="relative">
            <Shield size={48} className="text-yellow-400 mx-auto mb-6" />
            <h2 className="font-display text-5xl tracking-wide text-white mb-4">
              READY TO ROLL?
            </h2>
            <p className="text-slate-400 mb-8">
              Create a free account and get $5 in bonus credits to start opening cases immediately.
            </p>
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
