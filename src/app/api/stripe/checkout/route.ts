// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await req.json()
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)

    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `TCGRoll Credits — $${pkg.credits} Balance`,
              description: `Add $${pkg.credits}.00 to your TCGRoll balance`,
              images: [`${process.env.NEXTAUTH_URL}/logo.png`],
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        credits: pkg.credits,
        packageId: pkg.id,
      },
      success_url: `${process.env.NEXTAUTH_URL}/profile?deposit=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/profile?deposit=cancelled`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
