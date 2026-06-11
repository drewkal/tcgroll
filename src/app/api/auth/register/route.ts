// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/emails/welcome'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body.email as string)?.toLowerCase().trim()
    const { password, name } = body

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

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, balance: 500 },
    })

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 500,
        type: 'DEPOSIT',
        description: '🪙 500 welcome bonus!',
      },
    })

    await sendEmail({
      to: email,
      subject: '🎉 Welcome to TCGRoll — your 🪙 500 tokens are ready!',
      html: welcomeEmail({ name }),
    })

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New sign-up: ${name}`,
        html: `<p><strong>${name}</strong> just signed up on TCGRoll.</p><p>Email: ${email}</p><p><a href="https://tcgroll.com/admin">View Admin Panel</a></p>`,
      })
    }

    return NextResponse.json({ success: true, message: 'Account created with 🪙 500 welcome bonus!' })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
