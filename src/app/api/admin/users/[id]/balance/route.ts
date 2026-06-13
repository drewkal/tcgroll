import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { balance } = await req.json()

  if (typeof balance !== 'number' || balance < 0) {
    return NextResponse.json({ error: 'Invalid balance' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { balance },
  })

  await prisma.transaction.create({
    data: {
      userId: id,
      amount: balance,
      type: 'DEPOSIT',
      description: `Admin adjusted balance to 🪙${balance}`,
    },
  })

  return NextResponse.json({ success: true, balance: user.balance })
}
