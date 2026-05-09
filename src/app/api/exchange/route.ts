// src/app/api/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [exchanges, inventory] = await Promise.all([
      prisma.exchange.findMany({
        where: { status: 'OPEN' },
        include: {
          offeringUser: { select: { id: true, name: true, image: true } },
          offeredCard: { include: { card: true } },
          wantedCard: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userCard.findMany({
        where: { userId: session.user.id, sold: false, withdrawn: false, exchangeOffered: null },
        include: { card: true },
        orderBy: { obtainedAt: 'desc' },
      }),
    ])

    return NextResponse.json({ exchanges, inventory })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch exchanges' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { offeredCardId, wantedCardId } = await req.json()
    if (!offeredCardId || !wantedCardId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify the user owns the offered card and it's not locked
    const userCard = await prisma.userCard.findFirst({
      where: { id: offeredCardId, userId: session.user.id, sold: false, withdrawn: false },
      include: { exchangeOffered: true },
    })
    if (!userCard) return NextResponse.json({ error: 'Card not available' }, { status: 400 })
    if (userCard.exchangeOffered) return NextResponse.json({ error: 'Card already in an exchange' }, { status: 400 })

    const wantedCard = await prisma.card.findUnique({ where: { id: wantedCardId } })
    if (!wantedCard) return NextResponse.json({ error: 'Wanted card not found' }, { status: 400 })

    const exchange = await prisma.exchange.create({
      data: {
        offeringUserId: session.user.id,
        offeredCardId,
        wantedCardId,
      },
      include: {
        offeringUser: { select: { id: true, name: true, image: true } },
        offeredCard: { include: { card: true } },
        wantedCard: true,
      },
    })

    return NextResponse.json(exchange)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create exchange' }, { status: 500 })
  }
}
