'use client'
import { getRarityColor } from '@/lib/opening-engine'

export type TickerPull = {
  id: string
  user: string
  card: string
  rarity: string
  caseName: string
}

const SEED: TickerPull[] = [
  { id: 's1',  user: 'TrainerRed',   card: 'Charizard ex',           rarity: 'LEGENDARY', caseName: 'Paldea Elite'    },
  { id: 's2',  user: 'LuffyFan99',   card: 'Monkey D. Luffy',        rarity: 'EPIC',      caseName: 'OP-09 Pack'      },
  { id: 's3',  user: 'DeckWizard',   card: 'Black Lotus',            rarity: 'LEGENDARY', caseName: 'Vintage Magic'   },
  { id: 's4',  user: 'SSGoku',       card: 'Ultra Instinct Goku',    rarity: 'LEGENDARY', caseName: 'DB Heroes'       },
  { id: 's5',  user: 'PikaPro',      card: 'Pikachu VMAX',           rarity: 'EPIC',      caseName: 'Crown Zenith'    },
  { id: 's6',  user: 'CardShark',    card: 'Nami',                   rarity: 'RARE',      caseName: 'OP-09 Pack'      },
  { id: 's7',  user: 'SpellCaster',  card: 'Jace, the Mind Sculptor',rarity: 'EPIC',      caseName: 'Modern Masters'  },
  { id: 's8',  user: 'Vegetto42',    card: 'Super Saiyan Vegeta',    rarity: 'RARE',      caseName: 'BT25 Case'       },
  { id: 's9',  user: 'PokeHunter',   card: 'Mewtwo ex',              rarity: 'LEGENDARY', caseName: 'Paldea Elite'    },
  { id: 's10', user: 'ZoroMain',     card: 'Roronoa Zoro',           rarity: 'EPIC',      caseName: 'OP-08 Pack'      },
  { id: 's11', user: 'AceTrainer',   card: 'Umbreon VMAX',           rarity: 'EPIC',      caseName: 'Crown Zenith'    },
  { id: 's12', user: 'DarkKnight',   card: 'Liliana of the Veil',    rarity: 'RARE',      caseName: 'Modern Masters'  },
  { id: 's13', user: 'SaiyaGod',     card: 'Gogeta Blue',            rarity: 'LEGENDARY', caseName: 'BT25 Case'       },
  { id: 's14', user: 'ReelMaster',   card: 'Rayquaza VMAX',          rarity: 'LEGENDARY', caseName: 'Paldea Elite'    },
  { id: 's15', user: 'SnapperX',     card: 'Boa Hancock',            rarity: 'EPIC',      caseName: 'OP-08 Pack'      },
]

const RARITY_EMOJI: Record<string, string> = {
  LEGENDARY: '🏆',
  EPIC: '✨',
  RARE: '⭐',
  UNCOMMON: '🔹',
  COMMON: '•',
}

export function RecentPullsTicker({ pulls }: { pulls: TickerPull[] }) {
  // Merge real pulls (first) with seed, deduplicate by id, cap at 30
  const merged: TickerPull[] = []
  const seen = new Set<string>()
  for (const p of [...pulls, ...SEED]) {
    if (!seen.has(p.id)) { seen.add(p.id); merged.push(p) }
    if (merged.length >= 30) break
  }

  // Duplicate so the loop is seamless
  const items = [...merged, ...merged]

  return (
    <div className="w-full overflow-hidden border-y border-white/5 bg-black/20 backdrop-blur-sm py-2.5 relative">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 z-10 w-16 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #080c18 0%, transparent 100%)' }} />
      <div className="absolute inset-y-0 right-0 z-10 w-16 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #080c18 0%, transparent 100%)' }} />

      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `ticker-scroll ${merged.length * 3.5}s linear infinite`,
          width: 'max-content',
        }}
      >
        {items.map((pull, i) => {
          const color = getRarityColor(pull.rarity)
          const emoji = RARITY_EMOJI[pull.rarity] ?? '•'
          return (
            <span key={`${pull.id}-${i}`} className="inline-flex items-center gap-1.5 text-sm font-mono">
              <span style={{ color }} className="text-xs">{emoji}</span>
              <span className="text-slate-300 font-medium">{pull.user}</span>
              <span className="text-slate-500">pulled</span>
              <span style={{ color }} className="font-semibold">{pull.card}</span>
              <span className="text-slate-500">from</span>
              <span className="text-slate-400">{pull.caseName}</span>
            </span>
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
