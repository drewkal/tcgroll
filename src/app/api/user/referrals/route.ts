import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

function genCode(name: string | null): string {
  const base = (name ?? 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X')
  return base + Math.random().toString(36).substring(2, 6).toUpperCase()
}

async function getOrCreateCode(userId: string, name: string | null): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = i < 5 ? genCode(name) : randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } })
      return code
    }
  }
  const fallback = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  await prisma.user.update({ where: { id: userId }, data: { referralCode: fallback } })
  return fallback
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      referralCode: true,
      referrals: {
        select: { id: true, name: true, createdAt: true, emailVerified: true, referralBonusPaid: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auto-generate code for existing users who don't have one yet
  const referralCode = user.referralCode ?? await getOrCreateCode(session.user.id, user.name ?? null)

  const verified = user.referrals.filter(r => r.emailVerified !== null)

  return NextResponse.json({
    referralCode,
    referrals: user.referrals,
    verifiedCount: verified.length,
    tokensEarned: verified.length * 500,
  })
}
