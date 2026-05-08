// src/app/api/admin/withdrawals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, trackingNumber, adminNotes } = await req.json()

  const updated = await prisma.withdrawRequest.update({
    where: { id },
    data: {
      ...(status         && { status }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(adminNotes     !== undefined && { adminNotes }),
    },
  })

  return NextResponse.json(updated)
}
