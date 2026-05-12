// src/app/api/admin/withdrawals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { WithdrawalShippedEmail } from '@/emails/withdrawal-shipped'
import React from 'react'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status, trackingNumber, adminNotes } = await req.json()

  const before = await prisma.withdrawRequest.findUnique({
    where: { id },
    include: { cards: { include: { userCard: { include: { card: true } } } } },
  })

  const updated = await prisma.withdrawRequest.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(adminNotes !== undefined && { adminNotes }),
    },
  })

  // Send shipping email on SHIPPED transition (with a tracking number)
  const resolvedTracking = trackingNumber || before?.trackingNumber
  if (status === 'SHIPPED' && before?.status !== 'SHIPPED' && resolvedTracking && before) {
    await sendEmail({
      to: before.email,
      subject: '📬 Your TCGRoll cards have shipped!',
      react: React.createElement(WithdrawalShippedEmail, {
        name: before.fullName,
        trackingNumber: resolvedTracking,
        cards: before.cards.map(wc => ({
          name: wc.userCard.card.name,
          rarity: wc.userCard.card.rarity,
        })),
        address: {
          line1: before.address,
          line2: `${before.city}, ${before.state} ${before.zipCode}, ${before.country}`,
        },
      }),
    })
  }

  return NextResponse.json(updated)
}
