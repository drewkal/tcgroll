import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { referralBlastEmail } from '@/emails/referral-blast'
import { randomUUID } from 'crypto'

const FROM = process.env.EMAIL_FROM ?? 'TCGRoll <noreply@tcgroll.com>'
const BASE = process.env.AUTH_URL ?? 'https://tcgroll.com'
const BATCH = 50

function genCode(name: string | null): string {
  const base = (name ?? 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X')
  return base + Math.random().toString(36).substring(2, 6).toUpperCase()
}

export async function POST() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  // All verified users (with or without referral codes)
  const users = await prisma.user.findMany({
    where: { emailVerified: { not: null } },
    select: { id: true, email: true, name: true, referralCode: true },
  })

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No verified users found' })
  }

  // Backfill referral codes for users who don't have one
  const missing = users.filter(u => !u.referralCode)
  for (const u of missing) {
    let code = genCode(u.name)
    // Retry on collision
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.user.findUnique({ where: { referralCode: code } })
      if (!exists) break
      code = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    }
    await prisma.user.update({ where: { id: u.id }, data: { referralCode: code } })
    u.referralCode = code
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  let failed = 0

  for (let i = 0; i < users.length; i += BATCH) {
    const chunk = users.slice(i, i + BATCH)
    const emails = chunk.map(u => ({
      from: FROM,
      to: u.email,
      subject: '🪙 Earn 500 free tokens — refer a friend to TCGRoll',
      html: referralBlastEmail({
        name: u.name ?? 'Trainer',
        referralCode: u.referralCode!,
        referralUrl: `${BASE}/register?ref=${u.referralCode}`,
      }),
    }))

    try {
      const { data, error } = await resend.batch.send(emails)
      if (error) {
        console.error('[email-blast] Batch error:', error)
        failed += chunk.length
      } else {
        sent += data?.data?.length ?? chunk.length
      }
    } catch (e) {
      console.error('[email-blast] Unexpected error:', e)
      failed += chunk.length
    }

    if (i + BATCH < users.length) await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({ sent, failed, total: users.length })
}
