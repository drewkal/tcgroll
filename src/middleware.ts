// src/middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Protect these routes — redirect to login if not authenticated
  const protectedRoutes = ['/collection', '/profile']
  const adminRoutes = ['/admin']

  if (protectedRoutes.some(r => pathname.startsWith(r)) && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (adminRoutes.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (req.auth?.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
