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

    const [userCards, wantedCard] = await Promise.all([
      prisma.userCard.findMany({
        where: { id: { in: userCardIds }, userId: session.user.id, sold: false, withdrawn: false },
        include: { card: true },
      }),
      prisma.card.findUnique({ where: { id: wantedCardId } }),
    ])

    if (userCards.length !== userCardIds.length) {
      return NextResponse.json({ error: 'One or more cards not available' }, { status: 400 })
    }
    if (!wantedCard) return NextResponse.json({ error: 'Requested card not found' }, { status: 400 })

    const offeredTotal = userCards.reduce((sum, uc) => sum + uc.card.value, 0)
    const diff = wantedCard.value - offeredTotal

    if (diff !== 0) {
      return NextResponse.json(
        { error: `Card values must match exactly. Offered: ${offeredTotal.toFixed(2)}, Wanted: ${wantedCard.value.toFixed(2)}` },
        { status: 400 }
      )
    }

    const cardNames = userCards.map(uc => uc.card.name).join(', ')

    await prisma.$transaction(async (tx) => {
      await tx.userCard.updateMany({
        where: { id: { in: userCardIds } },
        data: { sold: true, soldAt: new Date() },
      })
      await tx.userCard.create({ data: { userId: session.user.id, cardId: wantedCardId } })
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount: 0,
          type: 'EXCHANGE',
          description: `Exchanged ${cardNames} for ${wantedCard.name}`,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to complete exchange' }, { status: 500 })
  }
}
