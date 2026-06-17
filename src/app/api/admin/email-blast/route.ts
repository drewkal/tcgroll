import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { referralBlastEmail } from '@/emails/referral-blast'

const FROM = process.env.EMAIL_FROM ?? 'TCGRoll <noreply@tcgroll.com>'
const BASE = process.env.AUTH_URL ?? 'https://tcgroll.com'
const BATCH = 50 // Resend batch limit per call

export async function POST() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  // Only send to verified users who have a referral code
  const users = await prisma.user.findMany({
    where: { emailVerified: { not: null }, referralCode: { not: null } },
    select: { email: true, name: true, referralCode: true },
  })

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users found' })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  let failed = 0

  // Send in batches of BATCH
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

    // Small delay between batches to avoid rate limits
    if (i + BATCH < users.length) await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({ sent, failed, total: users.length })
}
