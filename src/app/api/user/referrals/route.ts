import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      referrals: {
        select: { id: true, name: true, createdAt: true, emailVerified: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const verified = user.referrals.filter(r => r.emailVerified !== null)
  const tokensEarned = verified.length * 500

  return NextResponse.json({
    referralCode: user.referralCode,
    referrals: user.referrals,
    verifiedCount: verified.length,
    tokensEarned,
  })
}
