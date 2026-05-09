// src/app/api/exchange/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { acceptedCardId } = await req.json()
    if (!acceptedCardId) return NextResponse.json({ error: 'Missing acceptedCardId' }, { status: 400 })

    const exchange = await prisma.exchange.findUnique({
      where: { id },
      include: {
        offeredCard: { include: { card: true } },
        wantedCard: true,
      },
    })
    if (!exchange) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (exchange.status !== 'OPEN') return NextResponse.json({ error: 'Exchange not open' }, { status: 400 })
    if (exchange.offeringUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot accept your own exchange' }, { status: 400 })
    }

    // The accepter must own the acceptedCard matching the wantedCard type
    const accepterCard = await prisma.userCard.findFirst({
      where: {
        id: acceptedCardId,
        userId: session.user.id,
        cardId: exchange.wantedCardId,
        sold: false,
        withdrawn: false,
      },
      include: { exchangeAccepted: true },
    })
    if (!accepterCard) return NextResponse.json({ error: 'You do not own this card or it is unavailable' }, { status: 400 })
    if (accepterCard.exchangeAccepted) return NextResponse.json({ error: 'Card already in an exchange' }, { status: 400 })

    // Balance settlement: offeredCard.value - wantedCard.value
    const offeredValue = exchange.offeredCard.card.value
    const wantedValue = exchange.wantedCard.value
    const diff = offeredValue - wantedValue

    // If offerer offered higher-value card: accepter must have enough balance to cover the difference
    if (diff < 0) {
      const accepterUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true } })
      if (!accepterUser || accepterUser.balance < Math.abs(diff)) {
        return NextResponse.json({ error: 'Insufficient balance to accept this exchange' }, { status: 400 })
      }
    }

    await prisma.$transaction(async (tx) => {
      // Transfer card ownership: offeredCard → accepter, acceptedCard → offerer
      await tx.userCard.update({ where: { id: exchange.offeredCardId }, data: { userId: session.user.id } })
      await tx.userCard.update({ where: { id: acceptedCardId }, data: { userId: exchange.offeringUserId } })

      // Balance: offerer gets +diff (positive if they gave more), accepter gets -diff
      if (diff !== 0) {
        await tx.user.update({ where: { id: exchange.offeringUserId }, data: { balance: { increment: diff } } })
        await tx.user.update({ where: { id: session.user.id }, data: { balance: { decrement: diff } } })

        // Record transactions
        if (diff > 0) {
          await tx.transaction.create({
            data: { userId: exchange.offeringUserId, amount: diff, type: 'EXCHANGE', description: 'Exchange balance settlement' },
          })
          await tx.transaction.create({
            data: { userId: session.user.id, amount: -diff, type: 'EXCHANGE', description: 'Exchange balance settlement' },
          })
        } else {
          await tx.transaction.create({
            data: { userId: session.user.id, amount: Math.abs(diff), type: 'EXCHANGE', description: 'Exchange balance settlement' },
          })
          await tx.transaction.create({
            data: { userId: exchange.offeringUserId, amount: diff, type: 'EXCHANGE', description: 'Exchange balance settlement' },
          })
        }
      }

      await tx.exchange.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          acceptingUserId: session.user.id,
          acceptedCardId,
          completedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to accept exchange' }, { status: 500 })
  }
}
