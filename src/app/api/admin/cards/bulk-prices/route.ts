import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cards = await prisma.card.findMany({
    orderBy: [{ game: 'asc' }, { rarity: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, game: true, rarity: true, value: true, setName: true },
  })

  const rows = [
    'id,name,game,rarity,set_name,value',
    ...cards.map(c =>
      [c.id, `"${c.name.replace(/"/g, '""')}"`, c.game, c.rarity, `"${(c.setName ?? '').replace(/"/g, '""')}"`, c.value].join(',')
    ),
  ].join('\n')

  return new Response(rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="card-prices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await req.json() as { updates: { id: string; value: number }[] }

  if (!Array.isArray(updates) || updates.length === 0)
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })

  if (updates.some(u => typeof u.id !== 'string' || typeof u.value !== 'number' || u.value < 0))
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  await prisma.$transaction(
    updates.map(u => prisma.card.update({ where: { id: u.id }, data: { value: u.value } }))
  )

  return NextResponse.json({ updated: updates.length })
}
