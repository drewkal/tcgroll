// src/app/api/withdrawals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withdrawals = await prisma.withdrawRequest.findMany({
    where: { userId: session.user.id },
    include: {
      cards: {
        include: { userCard: { include: { card: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(withdrawals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userCardIds, fullName, email, address, city, state, zipCode, country, phone, notes } = await req.json()

  if (!userCardIds?.length) return NextResponse.json({ error: 'Select at least one card' }, { status: 400 })
  if (!fullName || !email || !address || !city || !state || !zipCode || !country)
    return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 })

  // Verify all cards belong to this user and are not sold/withdrawn
  const userCards = await prisma.userCard.findMany({
    where: {
      id: { in: userCardIds },
      userId: session.user.id,
      sold: false,
      withdrawn: false,
    },
    include: { card: true },
  })

  if (userCards.length !== userCardIds.length)
    return NextResponse.json({ error: 'Some cards are unavailable' }, { status: 400 })

  const totalValue = userCards.reduce((sum, uc) => sum + uc.card.value, 0)
  if (totalValue < 1000)
    return NextResponse.json({ error: 'Minimum withdrawal value is 🪙 1,000 tokens' }, { status: 400 })

  const withdrawal = await prisma.$transaction(async tx => {
    const req = await tx.withdrawRequest.create({
      data: {
        userId: session.user.id,
        fullName, email, address, city, state, zipCode, country,
        phone:  phone  || null,
        notes:  notes  || null,
        cards: {
          create: userCardIds.map((id: string) => ({ userCardId: id })),
        },
      },
      include: { cards: { include: { userCard: { include: { card: true } } } } },
    })

    await tx.userCard.updateMany({
      where: { id: { in: userCardIds } },
      data: { withdrawn: true },
    })

    return req
  })

  return NextResponse.json(withdrawal)
}
