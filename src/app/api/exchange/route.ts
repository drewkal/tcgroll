// src/app/api/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [inventory, catalog] = await Promise.all([
      prisma.userCard.findMany({
        where: { userId: session.user.id, sold: false, withdrawn: false },
        include: { card: true },
        orderBy: { obtainedAt: 'desc' },
      }),
      prisma.card.findMany({
        orderBy: [{ value: 'desc' }],
      }),
    ])

    return NextResponse.json({ inventory, catalog })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userCardIds, wantedCardId } = await req.json()
    if (!Array.isArray(userCardIds) || userCardIds.length === 0 || !wantedCardId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const [userCards, wantedCard, user] = await Promise.all([
      prisma.userCard.findMany({
        where: { id: { in: userCardIds }, userId: session.user.id, sold: false, withdrawn: false },
        include: { card: true },
      }),
      prisma.card.findUnique({ where: { id: wantedCardId } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true } }),
    ])

    if (userCards.length !== userCardIds.length) {
      return NextResponse.json({ error: 'One or more cards not available' }, { status: 400 })
    }
    if (!wantedCard) return NextResponse.json({ error: 'Requested card not found' }, { status: 400 })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 400 })

    const offeredTotal = userCards.reduce((sum, uc) => sum + uc.card.value, 0)
    // diff > 0: user wants a more expensive card — they pay the diff
    // diff < 0: user wants a cheaper card — they receive the diff
    const diff = wantedCard.value - offeredTotal

    if (diff > 0 && user.balance < diff) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const cardNames = userCards.map(uc => uc.card.name).join(', ')

    await prisma.$transaction(async (tx) => {
      // Mark all offered cards as sold
      await tx.userCard.updateMany({
        where: { id: { in: userCardIds } },
        data: { sold: true, soldAt: new Date() },
      })

      // Give the user the wanted card
      await tx.userCard.create({ data: { userId: session.user.id, cardId: wantedCardId } })

      // Settle balance difference
      if (diff !== 0) {
        await tx.user.update({ where: { id: session.user.id }, data: { balance: { increment: -diff } } })
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            amount: -diff,
            type: 'EXCHANGE',
            description: `Exchanged ${cardNames} for ${wantedCard.name}`,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to complete exchange' }, { status: 500 })
  }
}
