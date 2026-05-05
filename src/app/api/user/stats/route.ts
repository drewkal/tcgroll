// src/app/api/user/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const [user, totalCards, totalOpenings, transactions, rarityBreakdown, recentOpenings] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { balance: true, createdAt: true, name: true, email: true, image: true } }),
        prisma.userCard.count({ where: { userId, sold: false } }),
        prisma.caseOpening.count({ where: { userId } }),
        prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
        prisma.userCard.groupBy({
          by: ['cardId'],
          where: { userId, sold: false },
          _count: true,
        }),
        prisma.caseOpening.findMany({
          where: { userId },
          include: {
            case: { select: { name: true, price: true } },
            openingCards: { include: { card: true }, take: 5 },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])

    // Get rarity counts
    const cardIds = rarityBreakdown.map(r => r.cardId)
    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      select: { id: true, rarity: true },
    })

    const rarityCount: Record<string, number> = {}
    for (const card of cards) {
      rarityCount[card.rarity] = (rarityCount[card.rarity] ?? 0) + 1
    }

    const totalSpent = transactions
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const totalDeposited = transactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      user,
      stats: {
        totalCards,
        totalOpenings,
        totalSpent,
        totalDeposited,
        currentBalance: user?.balance ?? 0,
        rarityCount,
      },
      transactions,
      recentOpenings,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
