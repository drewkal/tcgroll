// src/app/api/admin/withdrawals/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const withdrawals = await prisma.withdrawRequest.findMany({
    include: {
      user: { select: { name: true, email: true } },
      cards: { include: { userCard: { include: { card: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(withdrawals)
}
