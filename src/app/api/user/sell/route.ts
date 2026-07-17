// src/app/api/user/sell/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userCardIds } = await req.json()

    if (!Array.isArray(userCardIds) || userCardIds.length === 0) {
      return NextResponse.json({ error: 'No cards selected' }, { status: 400 })
    }

    // Deduplicate to prevent the same ID being double-counted
    const ids: string[] = [...new Set(userCardIds as string[])]

    // Fetch cards to sell — verify ownership and availability
    const userCards = await prisma.userCard.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
        sold: false,
        withdrawn: false,
      },
      include: { card: true },
    })

    if (userCards.length === 0) {
      return NextResponse.json({ error: 'No valid cards to sell' }, { status: 400 })
    }

    const totalValue = userCards.reduce((sum, uc) => sum + uc.card.value, 0)

    await prisma.$transaction(async (tx) => {
      // Re-assert sold: false inside the transaction so concurrent requests
      // can't both win — the second updateMany will return count: 0 and throw
      const result = await tx.userCard.updateMany({
        where: {
          id: { in: userCards.map(uc => uc.id) },
          sold: false,
          withdrawn: false,
        },
        data: { sold: true, soldAt: new Date() },
      })

      if (result.count !== userCards.length) {
        throw new Error('CONCURRENT_SELL')
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: totalValue } },
      })

      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: totalValue,
          type: 'SALE',
          description: `Sold ${userCards.length} card${userCards.length > 1 ? 's' : ''}`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      soldCount: userCards.length,
      totalValue,
    })
  } catch (error) {
    if ((error as Error).message === 'CONCURRENT_SELL') {
      return NextResponse.json({ error: 'Some cards were already sold' }, { status: 409 })
    }
    console.error('Sell error:', error)
    return NextResponse.json({ error: 'Failed to sell cards' }, { status: 500 })
  }
}
