import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const base = process.env.AUTH_URL ?? 'https://tcgroll.com'

  if (!token) return NextResponse.redirect(`${base}/cases?verified=error`)

  // Validate the token exists and hasn't expired before trying to consume it
  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || record.expires < new Date()) {
    if (record) await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.redirect(`${base}/cases?verified=expired`)
  }

  // Delete the token atomically — if two requests race, only one will succeed here.
  // The other will throw P2025 (record not found) and we redirect as already verified.
  try {
    await prisma.verificationToken.delete({ where: { token } })
  } catch {
    return NextResponse.redirect(`${base}/cases?verified=1`)
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } })

  if (!user) return NextResponse.redirect(`${base}/cases?verified=error`)

  // Only grant the bonus if not already verified (idempotency guard)
  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), balance: { increment: 500 } },
    })
    await prisma.transaction.create({
      data: { userId: user.id, amount: 500, type: 'DEPOSIT', description: '🪙 500 welcome bonus!' },
    })

    // Referral bonus: only pay if referrer exists and IPs differ
    if (user.referredById) {
      const referrer = await prisma.user.findUnique({
        where: { id: user.referredById },
        select: { registrationIp: true },
      })
      const sameIp =
        referrer?.registrationIp &&
        user.registrationIp &&
        referrer.registrationIp === user.registrationIp

      if (!sameIp) {
        await prisma.user.update({
          where: { id: user.referredById },
          data: { balance: { increment: 500 } },
        })
        await prisma.transaction.create({
          data: { userId: user.referredById, amount: 500, type: 'DEPOSIT', description: `🎉 Referral bonus — ${user.name ?? user.email} joined!` },
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { referralBonusPaid: true },
        })
      }
    }
  }

  return NextResponse.redirect(`${base}/cases?verified=1`)
}
