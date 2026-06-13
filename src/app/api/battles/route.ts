import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/battles — list open battles
export async function GET() {
  const battles = await prisma.battle.findMany({
    where: { status: 'WAITING', expiresAt: { gt: new Date() } },
    include: {
      creator: { select: { id: true, name: true } },
      case: { select: { id: true, name: true, price: true, game: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(battles)
}

// POST /api/battles — create a battle
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId, wager } = await req.json()
  if (!caseId) return NextResponse.json({ error: 'Case required' }, { status: 400 })

  const cardCase = await prisma.cardCase.findUnique({ where: { id: caseId, active: true } })
  if (!cardCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const wagerAmount = Math.max(0, Number(wager) || 0)
  const totalCost = cardCase.price + wagerAmount

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.balance < totalCost) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const [battle] = await prisma.$transaction([
    prisma.battle.create({
      data: {
        caseId,
        wager: wagerAmount,
        creatorId: session.user.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min to find opponent
      },
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
        description: `Battle created — ${cardCase.name} + 🪙${wagerAmount} wager`,
      },
    }),
  ])

  return NextResponse.json(battle)
}
