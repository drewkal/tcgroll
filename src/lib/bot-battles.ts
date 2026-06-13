import { prisma } from '@/lib/prisma'
import { openCase } from '@/lib/opening-engine'

export async function openBotCase(battleId: string, botUserId: string, caseId: string, casePrice: number) {
  await prisma.user.update({ where: { id: botUserId }, data: { balance: { increment: casePrice } } })

  const result = await openCase(caseId, botUserId)
  if (!result.success || !result.cards) {
    await prisma.user.update({ where: { id: botUserId }, data: { balance: { decrement: casePrice } } })
    return
  }

  const totalValue  = result.cards.reduce((s, c) => s + c.value, 0)
  const cardSummary = result.cards.map(c => ({
    id: c.id, name: c.name, rarity: c.rarity, value: c.value, imageUrl: c.imageUrl,
  }))

  await prisma.battle.update({
    where: { id: battleId },
    data:  { creatorCards: cardSummary, creatorValue: totalValue },
  })
}
