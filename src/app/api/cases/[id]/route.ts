// src/app/api/cases/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cardCase = await prisma.cardCase.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        active: true,
      },
      include: {
        caseCards: {
          include: { card: true },
          orderBy: { dropRate: 'desc' },
        },
        _count: { select: { openings: true } },
      },
    })

    if (!cardCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json(cardCase)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const updated = await prisma.cardCase.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.cardCase.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}
