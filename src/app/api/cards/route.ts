// src/app/api/cards/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rarity = searchParams.get('rarity')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')

    const cards = await prisma.card.findMany({
      where: {
        ...(rarity && { rarity: rarity as any }),
        ...(type && { pokemonType: type as any }),
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      orderBy: [{ rarity: 'desc' }, { value: 'desc' }],
      ...(limit && { take: parseInt(limit, 10) }),
    })

    return NextResponse.json(cards)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const card = await prisma.card.create({ data: body })
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }
}
