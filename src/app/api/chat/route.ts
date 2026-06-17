import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  })
  return NextResponse.json(messages.reverse())
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  const text = (content as string)?.trim()
  if (!text || text.length > 200) {
    return NextResponse.json({ error: 'Message must be 1–200 characters' }, { status: 400 })
  }

  // Rate limit: 1 message per 2 seconds
  const recent = await prisma.chatMessage.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  if (recent && Date.now() - recent.createdAt.getTime() < 2000) {
    return NextResponse.json({ error: 'Slow down!' }, { status: 429 })
  }

  const message = await prisma.chatMessage.create({
    data: { userId: session.user.id, content: text },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  })

  return NextResponse.json(message)
}
