import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { openBotCase } from '@/lib/bot-battles'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const battle = await prisma.battle.findUnique({ where: { id }, include: { case: true } })
  if (!battle) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
  if (battle.status !== 'WAITING') return NextResponse.json({ error: 'Battle is no longer open' }, { status: 400 })
  if (battle.creatorId === session.user.id) return NextResponse.json({ error: 'Cannot join your own battle' }, { status: 400 })
  if (battle.expiresAt < new Date()) return NextResponse.json({ error: 'Battle expired' }, { status: 400 })

  const totalCost = battle.case.price + battle.wager
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.balance < totalCost) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const [updated] = await prisma.$transaction([
    prisma.battle.update({
      where: { id },
      data: { joinerId: session.user.id, status: 'READY' },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: totalCost } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: -totalCost,
        type: 'PURCHASE',
        description: `Joined battle — ${battle.case.name} + 🪙${battle.wager} wager`,
      },
    }),
  ])

  // If creator is a bot, auto-open their case immediately
  const creator = await prisma.user.findUnique({ where: { id: battle.creatorId }, select: { email: true } })
  if (creator?.email?.endsWith('@tcgroll.bot')) {
    // Fire and forget — don't block the response
    openBotCase(id, battle.creatorId, battle.caseId, battle.case.price).catch(() => {})
  }

  return NextResponse.json(updated)
}
