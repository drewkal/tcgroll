import { NextRequest, NextResponse } from 'next/server'
import { seedBotBattles } from '@/lib/bot-battles'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await seedBotBattles(3)
  return NextResponse.json(result)
}
