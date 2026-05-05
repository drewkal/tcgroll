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

    // Fetch cards to sell — verify ownership
    const userCards = await prisma.userCard.findMany({
      where: {
        id: { in: userCardIds },
        userId: session.user.id,
        sold: false,
      },
      include: { card: true },
    })

    if (userCards.length === 0) {
      return NextResponse.json({ error: 'No valid cards to sell' }, { status: 400 })
    }

    const totalValue = userCards.reduce((sum, uc) => sum + uc.card.value, 0)

    await prisma.$transaction(async (tx) => {
      // Mark cards as sold
      await tx.userCard.updateMany({
        where: { id: { in: userCards.map(uc => uc.id) } },
        data: { sold: true, soldAt: new Date() },
      })

      // Credit balance
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: totalValue } },
      })

      // Record transaction
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
    console.error('Sell error:', error)
    return NextResponse.json({ error: 'Failed to sell cards' }, { status: 500 })
  }
}
