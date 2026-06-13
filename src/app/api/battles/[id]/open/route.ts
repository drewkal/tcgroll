import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { openCase } from '@/lib/opening-engine'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const battle = await prisma.battle.findUnique({ where: { id } })
  if (!battle) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
  if (battle.status !== 'READY') return NextResponse.json({ error: 'Battle not ready' }, { status: 400 })

  const isCreator = battle.creatorId === session.user.id
  const isJoiner  = battle.joinerId  === session.user.id
  if (!isCreator && !isJoiner) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  if (isCreator && battle.creatorCards) return NextResponse.json({ error: 'Already opened' }, { status: 400 })
  if (isJoiner  && battle.joinerCards)  return NextResponse.json({ error: 'Already opened' }, { status: 400 })

  const cardCase = await prisma.cardCase.findUnique({ where: { id: battle.caseId } })
  if (!cardCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  // Credit case price back so openCase can deduct it normally
  await prisma.user.update({ where: { id: session.user.id }, data: { balance: { increment: cardCase.price } } })

  const result = await openCase(battle.caseId, session.user.id)
  if (!result.success || !result.cards) {
    await prisma.user.update({ where: { id: session.user.id }, data: { balance: { decrement: cardCase.price } } })
    return NextResponse.json({ error: result.error ?? 'Failed to open' }, { status: 400 })
  }

  const totalValue   = result.cards.reduce((s, c) => s + c.value, 0)
  const cardSummary  = result.cards.map(c => ({ id: c.id, name: c.name, rarity: c.rarity, value: c.value, imageUrl: c.imageUrl }))
  const userCardIds  = result.userCardIds ?? []

  const updateData = isCreator
    ? { creatorCards: cardSummary, creatorValue: totalValue, creatorUserCardIds: userCardIds }
    : { joinerCards:  cardSummary, joinerValue:  totalValue, joinerUserCardIds:  userCardIds }

  const updatedBattle = await prisma.battle.findUnique({ where: { id } })
  const otherValue    = isCreator ? updatedBattle?.joinerValue : updatedBattle?.creatorValue
  const bothDone      = otherValue !== null && otherValue !== undefined

  let finalUpdate: Record<string, unknown> = { ...updateData }

  if (bothDone) {
    const creatorValue = isCreator ? totalValue : (updatedBattle?.creatorValue ?? 0)
    const joinerValue  = isJoiner  ? totalValue : (updatedBattle?.joinerValue  ?? 0)
    const winnerId     = creatorValue >= joinerValue ? battle.creatorId : battle.joinerId!
    const loserId      = winnerId === battle.creatorId ? battle.joinerId! : battle.creatorId
    const loserValue   = winnerId === battle.creatorId ? joinerValue : creatorValue
    const prize        = (battle.wager * 2) + loserValue

    finalUpdate = { ...finalUpdate, status: 'COMPLETE', winnerId }

    // Get loser's userCardIds (stored from their opening, or current player's if loser = current player)
    const loserUserCardIds: string[] = isCreator && winnerId !== battle.creatorId
      ? userCardIds  // current player is the loser
      : isJoiner && winnerId !== battle.joinerId
      ? userCardIds
      : ((winnerId === battle.creatorId
          ? (updatedBattle?.joinerUserCardIds as string[] | null)
          : (updatedBattle?.creatorUserCardIds as string[] | null)) ?? [])

    await prisma.$transaction([
      prisma.battle.update({ where: { id }, data: finalUpdate }),
      // Winner gets prize tokens
      prisma.user.update({ where: { id: winnerId }, data: { balance: { increment: prize } } }),
      prisma.transaction.create({
        data: { userId: winnerId, amount: prize, type: 'SALE', description: `🏆 Battle won — 🪙${prize}` },
      }),
      // Loser's cards are removed from their collection
      ...(loserUserCardIds.length > 0 ? [
        prisma.userCard.updateMany({
          where: { id: { in: loserUserCardIds }, userId: loserId },
          data:  { sold: true, soldAt: new Date() },
        }),
      ] : []),
    ])
  } else {
    await prisma.battle.update({ where: { id }, data: finalUpdate })
  }

  const final = await prisma.battle.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      joiner:  { select: { id: true, name: true } },
      case:    { select: { id: true, name: true, price: true, game: true, slug: true } },
    },
  })

  return NextResponse.json({ ...final, myCards: cardSummary, myValue: totalValue, newBalance: result.newBalance })
}
