// src/auth.config.ts — edge-compatible, no bcrypt/Prisma imports
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.balance = (user as any).balance
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.balance = token.balance as number
      }
      return session
    },
  },
} satisfies NextAuthConfig
