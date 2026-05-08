// src/app/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get('featured')
    const tier = searchParams.get('tier')

    const cases = await prisma.cardCase.findMany({
      where: {
        active: true,
        ...(featured === 'true' && { featured: true }),
        ...(tier && { tier: tier as any }),
      },
      include: {
        caseCards: {
          include: { card: true },
          orderBy: { dropRate: 'desc' },
        },
        _count: { select: { openings: true } },
      },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json(cases)
  } catch (error) {
    console.error('Cases fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseCards, ...caseData } = await req.json()
    const cardCase = await prisma.cardCase.create({
      data: {
        ...caseData,
        ...(Array.isArray(caseCards) && caseCards.length > 0 && {
          caseCards: {
            create: caseCards.map((cc: { cardId: string; dropRate: number }) => ({
              cardId: cc.cardId, dropRate: cc.dropRate,
            })),
          },
        }),
      },
    })
    return NextResponse.json(cardCase, { status: 201 })
  } catch (error) {
    console.error('Case create error:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}
