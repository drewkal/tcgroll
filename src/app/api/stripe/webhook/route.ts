// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, tokens } = session.metadata ?? {}

    if (!userId || !tokens) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const tokenAmount = parseInt(tokens, 10)

    // Idempotency: skip if this stripeId was already processed
    const existing = await prisma.transaction.findFirst({ where: { stripeId: session.id } })
    if (existing) return NextResponse.json({ received: true })

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: tokenAmount } },
      })
      await tx.transaction.create({
        data: {
          userId,
          amount: tokenAmount,
          type: 'DEPOSIT',
          description: `Purchased 🪙 ${tokenAmount.toLocaleString()} tokens`,
          stripeId: session.id,
        },
      })
    })

    console.log(`✅ Credited 🪙 ${tokenAmount} tokens to user ${userId}`)
  }

  return NextResponse.json({ received: true })
}
