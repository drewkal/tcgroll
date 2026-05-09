// src/app/api/exchange/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const exchange = await prisma.exchange.findUnique({ where: { id } })
    if (!exchange) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (exchange.offeringUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (exchange.status !== 'OPEN') {
      return NextResponse.json({ error: 'Exchange already completed or cancelled' }, { status: 400 })
    }

    await prisma.exchange.update({ where: { id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to cancel exchange' }, { status: 500 })
  }
}
