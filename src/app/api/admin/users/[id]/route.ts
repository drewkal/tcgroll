import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [user, accounts, transactions, openings, referredBy, referrals, counts] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, balance: true, role: true,
        emailVerified: true, createdAt: true, registrationIp: true,
        referralCode: true, referralBonusPaid: true, password: true, image: true,
        referredById: true,
      },
    }),
    prisma.account.findMany({
      where: { userId: id },
      select: { provider: true },
    }),
    prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, amount: true, type: true, description: true, createdAt: true, stripeId: true },
    }),
    prisma.caseOpening.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, totalCost: true, createdAt: true,
        case: { select: { name: true } },
        openingCards: { select: { card: { select: { name: true, value: true, rarity: true } } } },
      },
    }),
    prisma.user.findFirst({
      where: { referrals: { some: { id } } },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.findMany({
      where: { referredById: id },
      select: { id: true, name: true, email: true, createdAt: true, referralBonusPaid: true },
    }),
    Promise.all([
      prisma.caseOpening.count({ where: { userId: id } }),
      prisma.userCard.count({ where: { userId: id } }),
      prisma.withdrawRequest.count({ where: { userId: id } }),
    ]),
  ])

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totalSpent = transactions
    .filter(t => t.type === 'PURCHASE')
    .reduce((s, t) => s + t.amount, 0)

  const totalDeposited = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((s, t) => s + t.amount, 0)

  return NextResponse.json({
    user: { ...user, accounts, transactions, openings, referredBy, referrals, _count: { openings: counts[0], userCards: counts[1], withdrawals: counts[2] } },
    totalSpent,
    totalDeposited,
  })
}
