// src/app/battles/[id]/page.tsx
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { BattleRoomClient } from './client'

export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const battle = await prisma.battle.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      joiner:  { select: { id: true, name: true, image: true } },
      case:    {
        include: {
          caseCards: { include: { card: true }, orderBy: { card: { value: 'desc' } } },
        },
      },
    },
  })
  if (!battle) notFound()
  return <BattleRoomClient initialBattle={battle as any} />
}
