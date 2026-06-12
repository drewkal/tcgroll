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
      data: { emailVerified: new Date(), balance: { increment: 250 } },
    })
    await prisma.transaction.create({
      data: { userId: user.id, amount: 250, type: 'DEPOSIT', description: '🪙 250 email verification bonus!' },
    })
  }

  await prisma.verificationToken.delete({ where: { token } }).catch(() => {})

  return NextResponse.redirect(`${base}/cases?verified=1`)
}
