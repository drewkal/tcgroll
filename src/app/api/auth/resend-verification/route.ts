import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { verifyEmailTemplate } from '@/emails/verify-email'
import { randomUUID } from 'crypto'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.emailVerified) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
  }

  // Delete any existing token for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: session.user.email } })

  const token = randomUUID()
  await prisma.verificationToken.create({
    data: {
      identifier: session.user.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const base = process.env.AUTH_URL ?? 'https://tcgroll.com'
  await sendEmail({
    to: session.user.email,
    subject: '📬 Verify your TCGRoll email — claim 🪙 250 tokens',
    html: verifyEmailTemplate({
      name: session.user.name ?? 'Trainer',
      verifyUrl: `${base}/api/auth/verify-email?token=${token}`,
    }),
  })

  return NextResponse.json({ success: true })
}
