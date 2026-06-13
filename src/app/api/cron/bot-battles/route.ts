import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openCase } from '@/lib/opening-engine'
import bcrypt from 'bcryptjs'

const BOTS = [
  { email: 'bot.trainerred@tcgroll.bot',   name: 'TrainerRed'   },
  { email: 'bot.cardshark@tcgroll.bot',     name: 'CardShark'    },
  { email: 'bot.rollmaster@tcgroll.bot',    name: 'RollMaster'   },
  { email: 'bot.deckwizard@tcgroll.bot',    name: 'DeckWizard'   },
  { email: 'bot.grailseeker@tcgroll.bot',   name: 'GrailSeeker'  },
]
const BOT_WAGERS = [0, 0, 100, 250, 500]
const BOT_BALANCE = 999999

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Upsert bot users with high balance
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

  // 2. Clean up expired battles
  await prisma.battle.updateMany({
    where: { status: 'WAITING', expiresAt: { lt: new Date() } },
    data:  { status: 'EXPIRED' },
  })

  // 3. Count existing open bot battles
  const botIds = botUsers.map(b => b.id)
  const openBotBattles = await prisma.battle.count({
    where: { status: 'WAITING', creatorId: { in: botIds } },
  })
  const MAX_BOT_BATTLES = 5
  const toCreate = Math.min(MAX_BOT_BATTLES - openBotBattles, 3)

  if (toCreate <= 0) return NextResponse.json({ created: 0, reason: 'Max bot battles reached' })

  // 4. Pick random active cases
  const cases = await prisma.cardCase.findMany({
    where: { active: true },
    select: { id: true, price: true },
  })
  if (cases.length === 0) return NextResponse.json({ created: 0, reason: 'No cases' })

  const created: string[] = []
  const usedBotIndices = new Set<number>()

  for (let i = 0; i < toCreate; i++) {
    // Pick an unused bot
    const available = botUsers.filter((_, idx) => !usedBotIndices.has(idx))
    if (available.length === 0) break
    const bot = available[Math.floor(Math.random() * available.length)]
    usedBotIndices.add(botUsers.indexOf(bot))

    const cardCase = cases[Math.floor(Math.random() * cases.length)]
    const wager    = BOT_WAGERS[Math.floor(Math.random() * BOT_WAGERS.length)]
    const cost     = cardCase.price + wager

    const battle = await prisma.battle.create({
      data: {
        caseId:    cardCase.id,
        creatorId: bot.id,
        wager,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })
    await prisma.user.update({
      where: { id: bot.id },
      data:  { balance: { decrement: cost } },
    })
    created.push(battle.id)
  }

  return NextResponse.json({ created: created.length, battleIds: created })
}

// Also used internally: auto-open a bot's case in a battle
export async function openBotCase(battleId: string, botUserId: string, caseId: string, casePrice: number) {
  // Credit back the case price so openCase can deduct it normally
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
