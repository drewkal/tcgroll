import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const base = process.env.AUTH_URL ?? 'https://tcgroll.com'

  if (!token) return NextResponse.redirect(`${base}/cases?verified=error`)

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || record.expires < new Date()) {
    if (record) await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.redirect(`${base}/cases?verified=expired`)
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } })

  if (!user) return NextResponse.redirect(`${base}/cases?verified=error`)

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { email: record.identifier },
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

  await prisma.verificationToken.delete({ where: { token } }).catch(() => {})

  return NextResponse.redirect(`${base}/cases?verified=1`)
}
