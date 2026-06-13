import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/battles/[id] — poll battle state
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const battle = await prisma.battle.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      joiner:  { select: { id: true, name: true } },
      case:    { select: { id: true, name: true, price: true, game: true, slug: true } },
    },
  })
  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(battle)
}

// DELETE /api/battles/[id] — cancel (creator only, while WAITING)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const battle = await prisma.battle.findUnique({ where: { id }, include: { case: true } })
  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (battle.creatorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (battle.status !== 'WAITING') return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })

  const refund = battle.case.price + battle.wager
  await prisma.$transaction([
    prisma.battle.update({ where: { id }, data: { status: 'CANCELLED' } }),
    prisma.user.update({ where: { id: session.user.id }, data: { balance: { increment: refund } } }),
    prisma.transaction.create({
      data: { userId: session.user.id, amount: refund, type: 'REFUND', description: 'Battle cancelled — refund' },
    }),
  ])

  return NextResponse.json({ success: true })
}
