// src/app/api/user/collection/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rarity = searchParams.get('rarity')
    const sold = searchParams.get('sold')

    const userCards = await prisma.userCard.findMany({
      where: {
        userId: session.user.id,
        sold: sold === 'true',
        ...(rarity && { card: { rarity: rarity as any } }),
      },
      include: { card: true },
      orderBy: { obtainedAt: 'desc' },
    })

    return NextResponse.json(userCards)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}
