import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { banned: true, role: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.role === 'ADMIN') return NextResponse.json({ error: 'Cannot ban an admin' }, { status: 400 })

  const nowBanned = !user.banned
  await prisma.user.update({
    where: { id },
    data: { banned: nowBanned, bannedAt: nowBanned ? new Date() : null },
  })

  // Invalidate all sessions for the banned user
  if (nowBanned) {
    await prisma.session.deleteMany({ where: { userId: id } })
  }

  return NextResponse.json({ banned: nowBanned })
}
