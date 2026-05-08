// src/lib/games.ts
export const GAMES = {
  pokemon: {
    slug: 'pokemon',
    enum: 'POKEMON' as const,
    label: 'Pokémon',
    description: 'Catch legendary holos, Alt Arts, and Secret Rares from the world\'s most iconic TCG.',
    color: '#FFCB05',
    secondaryColor: '#3B4CCA',
    emoji: '⚡',
    bg: 'from-yellow-500/10 to-blue-600/5',
    border: 'border-yellow-500/20',
  },
  'one-piece': {
    slug: 'one-piece',
    enum: 'ONE_PIECE' as const,
    label: 'One Piece',
    description: 'Sail the Grand Line and pull ultra-rare Leader cards, Secret Rares, and Parallel Rares.',
    color: '#FF6B35',
    secondaryColor: '#CC0000',
    emoji: '🏴‍☠️',
    bg: 'from-orange-500/10 to-red-600/5',
    border: 'border-orange-500/20',
  },
  magic: {
    slug: 'magic',
    enum: 'MAGIC' as const,
    label: 'Magic: The Gathering',
    description: 'Tap into the multiverse and open packs containing Mythic Rares, Expeditions, and Masterpieces.',
    color: '#A855F7',
    secondaryColor: '#6366F1',
    emoji: '✨',
    bg: 'from-purple-500/10 to-indigo-600/5',
    border: 'border-purple-500/20',
  },
  'dragon-ball': {
    slug: 'dragon-ball',
    enum: 'DRAGON_BALL' as const,
    label: 'Dragon Ball',
    description: 'Power up and pull Special Rares, God Rares, and Collector\'s Rares from Dragon Ball Super Card Game.',
    color: '#F59E0B',
    secondaryColor: '#EF4444',
    emoji: '🔮',
    bg: 'from-amber-500/10 to-red-500/5',
    border: 'border-amber-500/20',
  },
} as const

export type GameSlug = keyof typeof GAMES

export const GAME_SLUGS = Object.keys(GAMES) as GameSlug[]

export function getGame(slug: string) {
  return GAMES[slug as GameSlug] ?? null
}
