// src/auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/emails/welcome'
import { randomUUID } from 'crypto'

function genRefCode(name: string | null | undefined): string {
  const base = (name ?? 'USER').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X')
  return base + Math.random().toString(36).substring(2, 6).toUpperCase()
}

async function uniqueRefCode(name: string | null | undefined): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = genRefCode(name)
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase().trim() },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          balance: user.balance,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    ] : []),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return
      const referralCode = await uniqueRefCode(user.name)
      await prisma.user.update({ where: { id: user.id }, data: { balance: 500, referralCode } })
      await prisma.transaction.create({
        data: { userId: user.id, amount: 500, type: 'DEPOSIT', description: '🪙 500 welcome bonus!' },
      })
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: '🎉 Welcome to TCGRoll — your 🪙 500 tokens are ready!',
          html: welcomeEmail({ name: user.name ?? 'Trainer' }),
        })
        if (process.env.ADMIN_EMAIL) {
          await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `New sign-up: ${user.name ?? 'Unknown'}`,
            html: `<p><strong>${user.name ?? 'Unknown'}</strong> just signed up on TCGRoll via Google.</p><p>Email: ${user.email}</p><p><a href="https://tcgroll.com/admin">View Admin Panel</a></p>`,
          })
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.balance = (user as any).balance
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { balance: true, role: true, emailVerified: true },
        })
        if (dbUser) {
          token.balance = dbUser.balance
          token.role = dbUser.role
          token.emailVerified = dbUser.emailVerified
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.balance = token.balance as number
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null
      }
      return session
    },
  },
})
