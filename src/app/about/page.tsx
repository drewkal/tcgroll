// src/app/about/page.tsx
import Link from 'next/link'
import { Zap, Package, TrendingUp, Shield } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— OUR STORY</p>
      <h1 className="font-display text-6xl tracking-wide text-white mb-4">ABOUT TCGROLL</h1>
      <p className="text-slate-400 text-lg leading-relaxed mb-16">
        TCGRoll is the ultimate virtual card opening platform for Trading Card Game collectors.
        Built for fans of Pokémon, One Piece, Magic: The Gathering, and Dragon Ball — we bring the thrill
        of cracking packs to your screen.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
        {[
          { icon: Package, title: 'Real Rarity Odds', desc: 'Every case uses provably fair weighted randomness that mirrors real booster pack odds.' },
          { icon: Zap, title: 'Multi-Game Library', desc: 'Four iconic TCGs in one place — Pokémon, One Piece, Magic, and Dragon Ball.' },
          { icon: TrendingUp, title: 'Build & Trade', desc: 'Collect cards, sell duplicates for tokens, or exchange for cards you actually want.' },
          { icon: Shield, title: 'Safe & Fair', desc: 'All tokens are virtual. No gambling, no real money wagered — just pure collection fun.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass rounded-2xl border border-white/5 p-6">
            <Icon size={28} className="text-yellow-400 mb-4" />
            <h3 className="font-display text-xl tracking-wide text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl border border-yellow-400/20 p-8 text-center">
        <h2 className="font-display text-3xl tracking-wide text-white mb-3">Ready to start collecting?</h2>
        <p className="text-slate-400 mb-6">Create a free account and receive 🪙 500 bonus tokens to open your first cases.</p>
        <Link href="/register" className="btn-gold inline-flex px-8 py-3 rounded-xl font-display tracking-widest">
          Get Started Free
        </Link>
      </div>
    </div>
  )
}
