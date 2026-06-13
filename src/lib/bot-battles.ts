import { prisma } from '@/lib/prisma'
import { openCase } from '@/lib/opening-engine'
import bcrypt from 'bcryptjs'

const BOTS = [
  { email: 'bot.trainerred@tcgroll.bot',  name: 'TrainerRed'  },
  { email: 'bot.cardshark@tcgroll.bot',   name: 'CardShark'   },
  { email: 'bot.rollmaster@tcgroll.bot',  name: 'RollMaster'  },
  { email: 'bot.deckwizard@tcgroll.bot',  name: 'DeckWizard'  },
  { email: 'bot.grailseeker@tcgroll.bot', name: 'GrailSeeker' },
]
const BOT_WAGERS  = [0, 0, 100, 250, 500]
const BOT_BALANCE = 999999

export async function seedBotBattles(maxNew = 3): Promise<{ created: number }> {
  const pw = await bcrypt.hash('bot-password-internal', 10)
  const botUsers = await Promise.all(
    BOTS.map(b =>
      prisma.user.upsert({
        where:  { email: b.email },
        update: { balance: BOT_BALANCE },
        create: { email: b.email, name: b.name, password: pw, balance: BOT_BALANCE, emailVerified: new Date() },
      })
    )
  )

  // Clean up expired battles
  await prisma.battle.updateMany({
    where: { status: 'WAITING', expiresAt: { lt: new Date() } },
    data:  { status: 'EXPIRED' },
  })

  const botIds = botUsers.map(b => b.id)
  const openBotBattles = await prisma.battle.count({
    where: { status: 'WAITING', creatorId: { in: botIds } },
  })
  const toCreate = Math.min(5 - openBotBattles, maxNew)
  if (toCreate <= 0) return { created: 0 }

  const cases = await prisma.cardCase.findMany({
    where: { active: true },
    select: { id: true, price: true },
  })
  if (cases.length === 0) return { created: 0 }

  let created = 0
  const used = new Set<number>()

  for (let i = 0; i < toCreate; i++) {
    const available = botUsers.filter((_, idx) => !used.has(idx))
    if (!available.length) break
    const bot = available[Math.floor(Math.random() * available.length)]
    used.add(botUsers.indexOf(bot))

    const cardCase = cases[Math.floor(Math.random() * cases.length)]
    const wager    = BOT_WAGERS[Math.floor(Math.random() * BOT_WAGERS.length)]

    await prisma.battle.create({
      data: { caseId: cardCase.id, creatorId: bot.id, wager, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    })
    await prisma.user.update({ where: { id: bot.id }, data: { balance: { decrement: cardCase.price + wager } } })
    created++
  }

  return { created }
}

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
