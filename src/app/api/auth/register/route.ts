// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { verifyEmailTemplate } from '@/emails/verify-email'
import { randomUUID } from 'crypto'

function generateReferralCode(name: string): string {
  const base = name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X')
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${base}${suffix}`
}

async function uniqueReferralCode(name: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode(name)
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body.email as string)?.toLowerCase().trim()
    const { password, name, referralCode: refCode } = body
    const ip = getIp(req)

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Block more than 3 accounts from the same IP
    if (ip !== '0.0.0.0') {
      const ipCount = await prisma.user.count({ where: { registrationIp: ip } })
      if (ipCount >= 3) {
        return NextResponse.json({ error: 'Too many accounts registered from this network. Contact support if this is a mistake.' }, { status: 429 })
      }
    }

    // Look up referrer
    let referredById: string | undefined
    if (refCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } })
      if (referrer) referredById = referrer.id
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const myReferralCode = await uniqueReferralCode(name)

    await prisma.user.create({
      data: { email, password: hashedPassword, name, balance: 0, referralCode: myReferralCode, referredById, registrationIp: ip },
    })

    // Send verification email — tokens are awarded on verification
    const verifyToken = randomUUID()
    await prisma.verificationToken.create({
      data: { identifier: email, token: verifyToken, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    })
    const base = process.env.AUTH_URL ?? 'https://tcgroll.com'
    await sendEmail({
      to: email,
      subject: '📬 Verify your TCGRoll email — claim 🪙 500 free tokens',
      html: verifyEmailTemplate({ name, verifyUrl: `${base}/api/auth/verify-email?token=${verifyToken}` }),
    })

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New sign-up: ${name}`,
        html: `<p><strong>${name}</strong> just signed up on TCGRoll.</p><p>Email: ${email}</p><p><a href="https://tcgroll.com/admin">View Admin Panel</a></p>`,
      })
    }

    return NextResponse.json({ success: true, message: 'Account created! Check your email to claim 🪙 500 free tokens.' })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
