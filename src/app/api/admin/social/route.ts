// src/app/api/admin/social/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    throw new Error('Unauthorized')
}

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const links = await prisma.socialLink.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(links)
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { platform, url, active, order } = await req.json()
  if (!platform || !url) return NextResponse.json({ error: 'platform and url are required' }, { status: 400 })
  const link = await prisma.socialLink.create({
    data: { platform, url, active: active ?? true, order: order ?? 0 },
  })
  return NextResponse.json(link)
}
