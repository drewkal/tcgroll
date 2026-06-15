import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 30

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const rows = await prisma.openingCard.findMany({
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
  })

  const pulls = rows
    .filter(r => r.opening.user.name)
    .map(r => ({
      id: r.id,
      user: r.opening.user.name!.split(' ')[0],
      card: r.card.name,
      rarity: r.card.rarity,
      caseName: r.opening.case.name,
      imageUrl: r.card.imageUrl,
    }))

  return NextResponse.json(pulls, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  })
}
