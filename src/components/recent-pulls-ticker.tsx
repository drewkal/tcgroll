'use client'
import { getRarityColor } from '@/lib/opening-engine'

export type TickerPull = {
  id: string
  user: string
  card: string
  rarity: string
  caseName: string
  imageUrl: string | null
}

const SEED: TickerPull[] = [
  { id: 's1',  user: 'TrainerRed',   card: 'Charizard ex',            rarity: 'LEGENDARY', caseName: 'Paldea Elite',   imageUrl: null },
  { id: 's2',  user: 'LuffyFan99',   card: 'Monkey D. Luffy',         rarity: 'EPIC',      caseName: 'OP-09 Pack',     imageUrl: null },
  { id: 's3',  user: 'DeckWizard',   card: 'Black Lotus',             rarity: 'LEGENDARY', caseName: 'Vintage Magic',  imageUrl: null },
  { id: 's4',  user: 'SSGoku',       card: 'Ultra Instinct Goku',     rarity: 'LEGENDARY', caseName: 'DB Heroes',      imageUrl: null },
  { id: 's5',  user: 'PikaPro',      card: 'Pikachu VMAX',            rarity: 'EPIC',      caseName: 'Crown Zenith',   imageUrl: null },
  { id: 's6',  user: 'SpellCaster',  card: 'Jace, Mind Sculptor',     rarity: 'EPIC',      caseName: 'Modern Masters', imageUrl: null },
  { id: 's7',  user: 'PokeHunter',   card: 'Mewtwo ex',               rarity: 'LEGENDARY', caseName: 'Paldea Elite',   imageUrl: null },
  { id: 's8',  user: 'ZoroMain',     card: 'Roronoa Zoro',            rarity: 'EPIC',      caseName: 'OP-08 Pack',     imageUrl: null },
  { id: 's9',  user: 'AceTrainer',   card: 'Umbreon VMAX',            rarity: 'EPIC',      caseName: 'Crown Zenith',   imageUrl: null },
  { id: 's10', user: 'SaiyaGod',     card: 'Gogeta Blue',             rarity: 'LEGENDARY', caseName: 'BT25 Case',      imageUrl: null },
  { id: 's11', user: 'ReelMaster',   card: 'Rayquaza VMAX',           rarity: 'LEGENDARY', caseName: 'Paldea Elite',   imageUrl: null },
  { id: 's12', user: 'SnapperX',     card: 'Boa Hancock',             rarity: 'EPIC',      caseName: 'OP-08 Pack',     imageUrl: null },
]

export function RecentPullsTicker({ pulls }: { pulls: TickerPull[] }) {
  const merged: TickerPull[] = []
  const seen = new Set<string>()
  for (const p of [...pulls, ...SEED]) {
    if (!seen.has(p.id)) { seen.add(p.id); merged.push(p) }
    if (merged.length >= 30) break
  }

  const items = [...merged, ...merged]

  return (
    <div className="w-full overflow-hidden bg-black/40 backdrop-blur-sm border-b border-white/5 py-3 relative">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 z-10 w-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
      <div className="absolute inset-y-0 right-0 z-10 w-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />

      <div
        className="flex gap-5 items-center"
        style={{
          animation: `ticker-scroll ${merged.length * 4}s linear infinite`,
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
              {/* Card image */}
              <div
                className="rounded-md overflow-hidden flex-shrink-0"
                style={{
                  width: 36,
                  height: 50,
                  border: `1.5px solid ${color}55`,
                  boxShadow: `0 0 8px ${color}44`,
                  background: `linear-gradient(160deg, ${color}22 0%, #0a0f1e 80%)`,
                }}
              >
                {pull.imageUrl ? (
                  <img
                    src={pull.imageUrl}
                    alt={pull.card}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[10px] font-mono text-center leading-tight px-0.5"
                    style={{ color: color + 'aa' }}
                  >
                    {pull.card.slice(0, 6)}
                  </div>
                )}
              </div>

              {/* Text */}
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
      `}</style>
    </div>
  )
}
