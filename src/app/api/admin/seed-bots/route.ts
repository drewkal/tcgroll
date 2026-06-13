import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { seedBotBattles } from '@/lib/bot-battles'

export async function POST() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await seedBotBattles(5)
  return NextResponse.json(result)
}
