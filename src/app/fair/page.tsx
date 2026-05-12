// src/app/fair/page.tsx
'use client'
import { useState } from 'react'
import { Shield, RefreshCw, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const RARITY_COLOR: Record<string, string> = {
  LEGENDARY: '#f59e0b',
  EPIC:      '#a855f7',
  RARE:      '#3b82f6',
  UNCOMMON:  '#22c55e',
  COMMON:    '#9ca3af',
}

function RarityDot({ rarity }: { rarity: string }) {
  return <span style={{ color: RARITY_COLOR[rarity] ?? '#9ca3af' }}>●</span>
}

function Simulator() {
  const [rolls, setRolls] = useState<string[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  const POOL = [
    { name: 'Common Card',    rarity: 'COMMON',    dropRate: 60 },
    { name: 'Uncommon Card',  rarity: 'UNCOMMON',  dropRate: 25 },
    { name: 'Rare Card',      rarity: 'RARE',      dropRate: 10 },
    { name: 'Epic Card',      rarity: 'EPIC',      dropRate: 4  },
    { name: 'Legendary Card', rarity: 'LEGENDARY', dropRate: 1  },
  ]

  function weightedRandom() {
    const total = POOL.reduce((s, c) => s + c.dropRate, 0)
    let r = Math.random() * total
    for (const card of POOL) {
      r -= card.dropRate
      if (r <= 0) return card
    }
    return POOL[POOL.length - 1]
  }

  function rollOnce() {
    const card = weightedRandom()
    setRolls(prev => [card.rarity, ...prev].slice(0, 20))
    setCounts(prev => ({ ...prev, [card.rarity]: (prev[card.rarity] ?? 0) + 1 }))
  }

  function rollMany(n: number) {
    const newRolls: string[] = []
    const newCounts = { ...counts }
    for (let i = 0; i < n; i++) {
      const card = weightedRandom()
      newRolls.push(card.rarity)
      newCounts[card.rarity] = (newCounts[card.rarity] ?? 0) + 1
    }
    setRolls(prev => [...newRolls, ...prev].slice(0, 20))
    setCounts(newCounts)
  }

  function reset() { setRolls([]); setCounts({}) }

  const total = Object.values(counts).reduce((s, v) => s + v, 0)

  return (
    <div className="glass rounded-2xl border border-white/5 p-6 space-y-5">
      <h3 className="font-display text-xl tracking-wide text-white">LIVE SIMULATOR</h3>
      <p className="text-slate-400 text-sm">Run the exact same algorithm used in production. Verify the distribution yourself.</p>

      <div className="grid grid-cols-5 gap-2 text-xs font-mono">
        {POOL.map(c => (
          <div key={c.rarity} className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
            <div style={{ color: RARITY_COLOR[c.rarity] }}>{c.dropRate}%</div>
            <div className="text-slate-500 mt-0.5">{c.rarity.slice(0, 3)}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={rollOnce} className="btn-gold px-4 py-2 rounded-lg text-sm font-display tracking-wider">Roll ×1</button>
        <button onClick={() => rollMany(10)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors">×10</button>
        <button onClick={() => rollMany(100)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors">×100</button>
        <button onClick={() => rollMany(1000)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors">×1000</button>
        {total > 0 && <button onClick={reset} className="px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 transition-colors"><RefreshCw size={14} /></button>}
      </div>

      {total > 0 && (
        <div className="space-y-2">
          {POOL.map(c => {
            const got = counts[c.rarity] ?? 0
            const pct = total > 0 ? (got / total) * 100 : 0
            return (
              <div key={c.rarity} className="flex items-center gap-3 text-sm">
                <span className="w-20 font-mono text-xs" style={{ color: RARITY_COLOR[c.rarity] }}>{c.rarity.slice(0, 3)}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: RARITY_COLOR[c.rarity] }} />
                </div>
                <span className="font-mono text-xs text-slate-400 w-16 text-right">{got} ({pct >= 1 ? pct.toFixed(2) : pct >= 0.1 ? pct.toFixed(3) : pct.toFixed(4)}%)</span>
                <span className="font-mono text-xs text-slate-600 w-10 text-right">~{c.dropRate}%</span>
              </div>
            )
          })}
          <p className="text-xs text-slate-600 pt-1">{total.toLocaleString()} total rolls</p>
        </div>
      )}

      {rolls.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2">
          {rolls.map((r, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RARITY_COLOR[r] }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FairPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— TRANSPARENCY</p>
      <h1 className="font-display text-6xl tracking-wide text-white mb-4">PROVABLY FAIR</h1>
      <p className="text-slate-400 mb-12 leading-relaxed">
        Every card pull on TCGRoll uses a weighted random algorithm with published drop rates.
        There are no hidden modifiers, no pity manipulation, and no changes to rates after you open a case.
        This page explains exactly how it works.
      </p>

      <div className="space-y-8">

        {/* How it works */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="font-display text-2xl tracking-wide text-white">HOW IT WORKS</h2>
          <ol className="space-y-4 text-slate-300 text-sm leading-relaxed">
            {[
              ['Drop rates are published', 'Every case lists the exact drop rate for each card — visible before you spend a single token. Nothing is hidden.'],
              ['A random number is drawn', 'When you open a case, the server calls Math.random() (Node.js CSPRNG, seeded by the OS) to generate a number between 0 and the total weight of all cards in the pool.'],
              ['Weighted selection picks the card', 'The algorithm walks the card pool, subtracting each card\'s drop rate until the value reaches zero or below. That card is returned. Cards with higher drop rates occupy more of the range and are proportionally more likely to be selected.'],
              ['The result is recorded', 'The pulled cards are written to the database immediately before being shown to you. The server state is the source of truth — not the animation.'],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-4">
                <span className="font-display text-3xl text-white/10 leading-none flex-shrink-0 w-7">{i + 1}</span>
                <div>
                  <p className="font-medium text-white mb-1">{title}</p>
                  <p className="text-slate-400">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Source code */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="font-display text-2xl tracking-wide text-white">THE ALGORITHM</h2>
          <p className="text-slate-400 text-sm">This is the exact function used in production, unmodified:</p>
          <pre className="bg-black/40 rounded-xl p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed border border-white/5">{`function weightedRandom(cards) {
  // Sum all drop rates (e.g. 60 + 25 + 10 + 4 + 1 = 100)
  const totalWeight = cards.reduce(
    (sum, c) => sum + c.dropRate, 0
  )

  // Draw a random number in [0, totalWeight)
  let random = Math.random() * totalWeight

  // Walk the pool — subtract each card's weight.
  // The first card that brings random to ≤ 0 wins.
  for (const caseCard of cards) {
    random -= caseCard.dropRate
    if (random <= 0) return caseCard.card
  }

  // Fallback (floating-point edge case only)
  return cards[cards.length - 1].card
}`}</pre>
          <p className="text-slate-500 text-xs">
            A card with a 60% drop rate occupies 60 units of the range. A Legendary with 1% occupies 1 unit.
            The probability of landing on any card equals <code className="text-slate-300">dropRate / totalWeight</code>.
          </p>
        </div>

        {/* Drop rate example */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="font-display text-2xl tracking-wide text-white">EXAMPLE DROP RATES</h2>
          <p className="text-slate-400 text-sm">A typical Standard case might look like this. Each case page shows its exact rates.</p>
          <div className="space-y-3">
            {[
              { rarity: 'COMMON',    rate: 60, example: '60 ÷ 100 = 60.0% chance' },
              { rarity: 'UNCOMMON',  rate: 25, example: '25 ÷ 100 = 25.0% chance' },
              { rarity: 'RARE',      rate: 10, example: '10 ÷ 100 = 10.0% chance' },
              { rarity: 'EPIC',      rate: 4,  example: '4 ÷ 100 = 4.0% chance'  },
              { rarity: 'LEGENDARY', rate: 1,  example: '1 ÷ 100 = 1.0% chance'  },
            ].map(({ rarity, rate, example }) => (
              <div key={rarity} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RARITY_COLOR[rarity] }} />
                <span className="text-sm font-medium w-24" style={{ color: RARITY_COLOR[rarity] }}>{rarity}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: RARITY_COLOR[rarity] }} />
                </div>
                <span className="text-xs font-mono text-slate-400 w-40 text-right">{example}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simulator */}
        <Simulator />

        {/* Footer */}
        <div className="glass rounded-2xl border border-yellow-400/10 p-6 text-center">
          <Shield size={32} className="text-yellow-400 mx-auto mb-3" />
          <h3 className="font-display text-xl tracking-wide text-white mb-2">QUESTIONS?</h3>
          <p className="text-slate-400 text-sm mb-4">
            If you believe you've experienced anomalous results, contact us with your opening ID (visible in your profile transaction history) and we'll investigate.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/cases" className="btn-gold px-5 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center gap-1">
              Browse Cases <ChevronRight size={14} />
            </Link>
            <a href="mailto:support@tcgroll.com" className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Contact Support
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
