// src/app/api/admin/social/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    throw new Error('Unauthorized')
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  const body = await req.json()
  const link = await prisma.socialLink.update({
    where: { id },
    data: {
      ...(body.platform   !== undefined && { platform: body.platform }),
      ...(body.url        !== undefined && { url: body.url }),
      ...(body.active     !== undefined && { active: body.active }),
      ...(body.order      !== undefined && { order: body.order }),
    },
  })
  return NextResponse.json(link)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  await prisma.socialLink.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
