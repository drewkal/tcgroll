import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

const SEED_USERS = [
  'TrainerRed', 'LuffyFan99', 'DeckWizard', 'SSGoku', 'PikaPro',
  'SpellCaster', 'PokeHunter', 'ZoroMain', 'AceTrainer', 'SaiyaGod',
  'ReelMaster', 'SnapperX',
]

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [rows, topCards] = await Promise.all([
    prisma.openingCard.findMany({
      where: {
        card: { rarity: { in: ['EPIC', 'LEGENDARY'] } },
        opening: { createdAt: { gte: since } },
      },
      include: {
        card: { select: { name: true, rarity: true, imageUrl: true } },
        opening: {
          select: {
            case: { select: { name: true } },
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { opening: { createdAt: 'desc' } },
      take: 15,
    }),
    prisma.card.findMany({
      where: { rarity: { in: ['EPIC', 'LEGENDARY'] } },
      select: { id: true, name: true, rarity: true, imageUrl: true },
      orderBy: { value: 'desc' },
      take: 24,
    }),
  ])

  const live = rows
    .filter(r => r.opening.user.name)
    .map(r => ({
      id: r.id,
      user: r.opening.user.name!.split(' ')[0],
      card: r.card.name,
      rarity: r.card.rarity,
      caseName: r.opening.case.name,
      imageUrl: r.card.imageUrl,
    }))

  // Build seed entries using real card images
  const seed = topCards.map((card, i) => ({
    id: `seed-${card.id}`,
    user: SEED_USERS[i % SEED_USERS.length],
    card: card.name,
    rarity: card.rarity,
    caseName: 'TCGRoll',
    imageUrl: card.imageUrl,
  }))

  return NextResponse.json({ live, seed }, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  })
}
