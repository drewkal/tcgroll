// src/lib/opening-engine.ts
import { prisma } from './prisma'
import { Card, CaseCard } from '@prisma/client'

type CardWithDropRate = CaseCard & { card: Card }

/**
 * Weighted random selection from cards pool based on drop rates
 */
export function weightedRandom(cards: CardWithDropRate[]): Card {
  const totalWeight = cards.reduce((sum, c) => sum + c.dropRate, 0)
  let random = Math.random() * totalWeight

  for (const caseCard of cards) {
    random -= caseCard.dropRate
    if (random <= 0) return caseCard.card
  }

  // Fallback to last card
  return cards[cards.length - 1].card
}

/**
 * Open a case and return the cards drawn
 */
export async function openCase(caseId: string, userId: string): Promise<{
  success: boolean
  cards?: Card[]
  userCardIds?: string[]
  error?: string
  newBalance?: number
}> {
  const cardCase = await prisma.cardCase.findUnique({
    where: { id: caseId },
    include: {
      caseCards: { include: { card: true } },
    },
  })

  if (!cardCase || !cardCase.active) {
    return { success: false, error: 'Case not found or inactive' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: 'User not found' }

  if (user.balance < cardCase.price) {
    return { success: false, error: 'Insufficient balance' }
  }

  // Draw cards based on case cardCount
  const drawnCards: Card[] = []
  for (let i = 0; i < cardCase.cardCount; i++) {
    const card = weightedRandom(cardCase.caseCards as CardWithDropRate[])
    drawnCards.push(card)
  }

  // Create opening record and deduct balance in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const opening = await tx.caseOpening.create({
      data: {
        userId,
        caseId,
        totalCost: cardCase.price,
        openingCards: {
          create: drawnCards.map(card => ({ cardId: card.id })),
        },
      },
    })

    // Add cards to user inventory — create individually to capture IDs
    const userCards = await Promise.all(
      drawnCards.map(card => tx.userCard.create({ data: { userId, cardId: card.id }, select: { id: true } }))
    )

    // Deduct balance
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: cardCase.price } },
    })

    // Record transaction
    await tx.transaction.create({
      data: {
        userId,
        amount: -cardCase.price,
        type: 'PURCHASE',
        description: `Opened ${cardCase.name}`,
      },
    })

    return { opening, newBalance: updatedUser.balance, userCardIds: userCards.map(uc => uc.id) }
  })

  return {
    success: true,
    cards: drawnCards,
    userCardIds: result.userCardIds,
    newBalance: result.newBalance,
  }
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    COMMON: '#9ca3af',
    UNCOMMON: '#22c55e',
    RARE: '#3b82f6',
    EPIC: '#a855f7',
    LEGENDARY: '#f59e0b',
  }
  return colors[rarity] ?? '#9ca3af'
}

export function getRarityGlow(rarity: string): string {
  const glows: Record<string, string> = {
    COMMON: 'shadow-gray-400/20',
    UNCOMMON: 'shadow-green-500/40',
    RARE: 'shadow-blue-500/40',
    EPIC: 'shadow-purple-500/50',
    LEGENDARY: 'shadow-yellow-400/60',
  }
  return glows[rarity] ?? 'shadow-gray-400/20'
}
