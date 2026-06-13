// src/app/battles/page.tsx
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { BattleLobbyClient } from './client'

export const metadata: Metadata = {
  title: 'Case Battles',
  description: 'Challenge another player to a case battle on TCGRoll. Open cases head-to-head and win their wager.',
}

async function getOpenBattles() {
  return prisma.battle.findMany({
    where: { status: 'WAITING', expiresAt: { gt: new Date() } },
    include: {
      creator: { select: { id: true, name: true } },
      case: { select: { id: true, name: true, price: true, game: true, slug: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

async function getActiveCases() {
  return prisma.cardCase.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true, game: true, slug: true },
    orderBy: { price: 'asc' },
  })
}

export default async function BattlesPage() {
  const [battles, cases] = await Promise.all([getOpenBattles(), getActiveCases()])
  return <BattleLobbyClient battles={battles as any} cases={cases} />
}
