// src/app/api/cases/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cardCase = await prisma.cardCase.findFirst({
      where: { OR: [{ id }, { slug: id }], active: true },
      include: {
        caseCards: { include: { card: true }, orderBy: { dropRate: 'desc' } },
        _count: { select: { openings: true } },
      },
    })
    if (!cardCase) return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    return NextResponse.json(cardCase)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseCards, ...caseData } = await req.json()

    const updated = await prisma.$transaction(async (tx: TxClient) => {
      const updatedCase = await tx.cardCase.update({ where: { id }, data: caseData })
      if (Array.isArray(caseCards)) {
        await tx.caseCard.deleteMany({ where: { caseId: id } })
        if (caseCards.length > 0) {
          await tx.caseCard.createMany({
            data: caseCards.map((cc: { cardId: string; dropRate: number }) => ({
              caseId: id, cardId: cc.cardId, dropRate: cc.dropRate,
            })),
          })
        }
      }
      return updatedCase
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await prisma.cardCase.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}
