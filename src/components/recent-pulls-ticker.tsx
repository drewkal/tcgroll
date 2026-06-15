'use client'
import { useEffect, useState } from 'react'
import { getRarityColor } from '@/lib/opening-engine'

export type TickerPull = {
  id: string
  user: string
  card: string
  rarity: string
  caseName: string
  imageUrl: string | null
}

function merge(live: TickerPull[], seed: TickerPull[]): TickerPull[] {
  if (seed.length === 0 && live.length === 0) return []
  const out: TickerPull[] = []
  const seen = new Set<string>()
  let li = 0, si = 0
  while (out.length < 30 && (li < live.length || si < seed.length)) {
    const takeLive = li < live.length && (si >= seed.length || li % 3 !== 2)
    const p = takeLive ? live[li++] : seed[si++ % Math.max(seed.length, 1)]
    if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p) }
  }
  return out
}

export function RecentPullsTicker() {
  const [pulls, setPulls] = useState<TickerPull[]>([])

  useEffect(() => {
    fetch('/api/recent-pulls')
      .then(r => r.ok ? r.json() : { live: [], seed: [] })
      .then(({ live, seed }: { live: TickerPull[]; seed: TickerPull[] }) => {
        const merged = merge(live, seed)
        if (merged.length > 0) setPulls(merged)
      })
      .catch(() => {})
  }, [])

  if (pulls.length === 0) return null
  const items = [...pulls, ...pulls]

  return (
    <div className="w-full overflow-hidden bg-black/40 backdrop-blur-sm border-b border-white/5 py-3 relative">
      <div className="absolute inset-y-0 left-0 z-10 w-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
      <div className="absolute inset-y-0 right-0 z-10 w-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />

      <div
        className="flex gap-5 items-center ticker-strip"
        style={{
          animation: `ticker-scroll ${pulls.length * 4}s linear infinite`,
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        {items.map((pull, i) => {
          const color = getRarityColor(pull.rarity)
          return (
            <div
              key={`${pull.id}-${i}`}
              className="flex items-center gap-2.5 flex-shrink-0 px-3 py-1 rounded-xl"
              style={{ background: color + '0d', border: `1px solid ${color}25` }}
            >
              <div
                className="rounded-md overflow-hidden flex-shrink-0"
                style={{
                  width: 36, height: 50,
                  border: `1.5px solid ${color}55`,
                  boxShadow: `0 0 8px ${color}44`,
                  background: `linear-gradient(160deg, ${color}22 0%, #0a0f1e 80%)`,
                }}
              >
                {pull.imageUrl ? (
                  <img src={pull.imageUrl} alt={pull.card} width={36} height={50} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-center leading-tight px-0.5" style={{ color: color + 'aa' }}>
                    {pull.card.slice(0, 6)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-[11px] font-mono text-slate-400 leading-tight">{pull.user}</span>
                <span className="text-[12px] font-semibold leading-tight whitespace-nowrap" style={{ color }}>
                  {pull.card.length > 20 ? pull.card.slice(0, 19) + '…' : pull.card}
                </span>
                <span className="text-[10px] font-mono text-slate-600 leading-tight">{pull.caseName}</span>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-strip { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
