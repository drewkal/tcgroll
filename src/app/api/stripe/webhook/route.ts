// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const { userId, credits } = session.metadata ?? {}
    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const amount = parseFloat(credits)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      })

      await tx.transaction.create({
        data: {
          userId,
          amount,
          type: 'DEPOSIT',
          description: `Deposited $${amount.toFixed(2)} via Stripe`,
          stripeId: session.id,
        },
      })
    })

    console.log(`✅ Credited $${amount} to user ${userId}`)
  }

  return NextResponse.json({ received: true })
}
