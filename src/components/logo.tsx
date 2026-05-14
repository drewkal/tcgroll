// src/components/logo.tsx

function DiceIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back die (slightly offset behind) */}
      <g transform="translate(18, 2)">
        <rect x="0" y="0" width="30" height="30" rx="6" fill="#7C4DAA" stroke="#4A2C6E" strokeWidth="1.5"/>
        <rect x="0" y="0" width="30" height="30" rx="6" fill="url(#diceShine2)" fillOpacity="0.3"/>
        {/* dots for 5 */}
        <circle cx="8"  cy="8"  r="2.8" fill="#2D1155"/>
        <circle cx="22" cy="8"  r="2.8" fill="#2D1155"/>
        <circle cx="15" cy="15" r="2.8" fill="#2D1155"/>
        <circle cx="8"  cy="22" r="2.8" fill="#2D1155"/>
        <circle cx="22" cy="22" r="2.8" fill="#2D1155"/>
      </g>
      {/* Front die */}
      <g transform="translate(2, 5)">
        <rect x="0" y="0" width="30" height="30" rx="6" fill="#9B5FC0" stroke="#6B3A8E" strokeWidth="1.5"/>
        <rect x="0" y="0" width="30" height="30" rx="6" fill="url(#diceShine1)" fillOpacity="0.35"/>
        {/* dots for 4 */}
        <circle cx="8"  cy="8"  r="2.8" fill="#3D1A6E"/>
        <circle cx="22" cy="8"  r="2.8" fill="#3D1A6E"/>
        <circle cx="8"  cy="22" r="2.8" fill="#3D1A6E"/>
        <circle cx="22" cy="22" r="2.8" fill="#3D1A6E"/>
      </g>
      <defs>
        <linearGradient id="diceShine1" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="diceShine2" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'hero' }) {
  const config = {
    sm:   { text: 'text-2xl',   dice: 22  },
    md:   { text: 'text-3xl',   dice: 28  },
    lg:   { text: 'text-5xl',   dice: 40  },
    hero: { text: 'text-[10rem]', dice: 140 },
  }[size]

  return (
    <span className={`inline-flex items-center gap-1 font-logo leading-none ${config.text}`}>
      <span style={{ color: '#C8D400' }}>TCG</span>
      <span className="text-white">ROLL</span>
      <DiceIcon size={config.dice} />
    </span>
  )
}
