import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type } = body

  if (type === 'name') {
    const { name } = body
    if (!name || typeof name !== 'string' || name.trim().length < 2)
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    if (name.trim().length > 32)
      return NextResponse.json({ error: 'Name must be 32 characters or fewer' }, { status: 400 })

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: { name: true },
    })
    return NextResponse.json({ name: updated.name })
  }

  if (type === 'password') {
    const { currentPassword, newPassword } = body

    if (!newPassword || newPassword.length < 8)
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // If user has a password set, verify current password
    if (user.password) {
      if (!currentPassword)
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid)
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
