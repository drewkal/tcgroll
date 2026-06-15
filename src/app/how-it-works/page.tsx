import { Metadata } from 'next'
import Link from 'next/link'
import { Package, Zap, LayoutGrid, ShoppingCart, Truck, ArrowLeftRight, CheckCircle, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how TCGRoll works — open virtual TCG cases, win real cards, buy from the marketplace, and get them shipped to your door.',
  alternates: { canonical: 'https://tcgroll.com/how-it-works' },
}

const STEPS = [
  {
    number: '01',
    icon: Zap,
    title: 'Get Your Tokens',
    color: '#fbbf24',
    desc: 'Sign up and instantly receive 500 free tokens to get started. Top up anytime by depositing — tokens are the currency used to open cases on TCGRoll.',
    bullets: ['500 free tokens on email verification', 'Top up via card, PayPal, or crypto', '1 token = £0.01'],
  },
  {
    number: '02',
    icon: Package,
    title: 'Open a Case',
    color: '#a78bfa',
    desc: 'Browse our library of cases across Pokémon, One Piece, Magic: The Gathering, and Dragon Ball. Each case contains a set of cards drawn using provably fair weighted odds — just like real booster packs.',
    bullets: ['Pick a case matching your budget', 'Watch the reel spin and reveal your cards', 'Odds are published on every case page'],
  },
  {
    number: '03',
    icon: LayoutGrid,
    title: 'Build Your Collection',
    color: '#34d399',
    desc: 'Every card you pull lands in your collection. Keep the ones you love, sell duplicates back for tokens, or trade with other players on the Exchange.',
    bullets: ['All won cards stored in your collection', 'Sell cards instantly for token value', 'Trade with other players via Exchange'],
  },
  {
    number: '04',
    icon: ShoppingCart,
    title: 'Buy Specific Cards',
    color: '#f97316',
    desc: 'Want a card without the luck of the draw? Browse the Cards marketplace and buy any card directly using your tokens. Perfect for completing sets or grabbing that one legendary you\'re missing.',
    bullets: ['Browse all available cards', 'Buy instantly with tokens', 'Card goes straight to your collection'],
  },
  {
    number: '05',
    icon: Truck,
    title: 'Get Them Shipped',
    color: '#60a5fa',
    desc: 'The cards you win on TCGRoll are real physical cards. When you\'re ready, request a withdrawal from your collection and we\'ll pack and ship your cards directly to your door.',
    bullets: ['Request withdrawal any time', 'Cards shipped within 3–5 business days', 'Tracked delivery to your address'],
  },
]

const FAQS = [
  {
    q: 'Are the cards real?',
    a: 'Yes. Every card in our cases corresponds to a real physical card. When you withdraw, we ship you the actual card.',
  },
  {
    q: 'How are odds determined?',
    a: 'Each case lists the exact drop rate for every card. We use provably fair weighted randomness — the same rarity system as real booster packs. You can verify outcomes on our Provably Fair page.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Once you request a withdrawal, orders are processed and shipped within 3–5 business days. You\'ll receive a tracking number by email.',
  },
  {
    q: 'What is the Exchange?',
    a: 'The Exchange lets you list cards from your collection for other players to claim, and browse cards listed by others. A great way to complete sets without spending tokens.',
  },
  {
    q: 'What are Battles?',
    a: 'Battles let you challenge another player head-to-head. Both players open the same case — whoever pulls the highest total card value wins both sets of cards, plus any wager.',
  },
  {
    q: 'Can I sell my cards back?',
    a: 'Yes. Any card in your collection can be sold back for its token value instantly from the Collection page.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-20">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-3">— GETTING STARTED</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-wide text-white mb-5">HOW IT WORKS</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          TCGRoll is a virtual case opening platform where the cards are real.
          Open cases, build your collection, and get your cards shipped to your door.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-24">
        {STEPS.map(({ number, icon: Icon, title, color, desc, bullets }) => (
          <div key={number} className="glass rounded-2xl border border-white/5 p-7 flex gap-6 hover:border-white/10 transition-colors">
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: color + '18', border: `1px solid ${color}30` }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <span className="font-mono text-2xl font-bold" style={{ color: color + '40' }}>{number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl text-white tracking-wide mb-2">{title}</h2>
              <p className="text-slate-400 leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {bullets.map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="text-yellow-400 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Battle callout */}
      <div className="glass rounded-2xl border border-yellow-400/20 p-8 mb-20 flex gap-5 items-start">
        <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
          <ArrowLeftRight size={22} className="text-yellow-400" />
        </div>
        <div>
          <h3 className="font-display text-xl text-white tracking-wide mb-1">Want more action? Try Battles.</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Challenge another player head-to-head. Both of you open the same case — the highest total card value wins everything, including the opponent's cards and any wager you set.
          </p>
          <Link href="/battles" className="text-yellow-400 text-sm font-mono hover:underline">
            View open battles →
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-20">
        <h2 className="font-display text-3xl text-white tracking-wide mb-8 flex items-center gap-3">
          <HelpCircle size={28} className="text-yellow-400" /> COMMON QUESTIONS
        </h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="glass rounded-xl border border-white/5 p-5">
              <p className="font-display text-white tracking-wide mb-1.5">{q}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="glass rounded-2xl border border-yellow-400/20 p-10 text-center">
        <h2 className="font-display text-4xl text-white tracking-wide mb-3">Ready to roll?</h2>
        <p className="text-slate-400 mb-8">Create a free account and get 500 tokens to open your first case.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="btn-gold px-8 py-3.5 rounded-xl font-display tracking-widest text-lg">
            Start Free — 🪙 500 Bonus
          </Link>
          <Link href="/cases" className="px-8 py-3.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all font-display tracking-wider text-lg">
            Browse Cases
          </Link>
        </div>
      </div>
    </div>
  )
}
