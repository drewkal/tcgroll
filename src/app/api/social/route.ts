// src/app/api/social/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const links = await prisma.socialLink.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(links)
}
