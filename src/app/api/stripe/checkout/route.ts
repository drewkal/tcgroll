// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe, TOKEN_PACKAGES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await req.json()
    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

    const baseUrl = process.env.NEXTAUTH_URL!

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `🪙 ${pkg.tokens.toLocaleString()} TCGRoll Tokens`,
              description: pkg.bonus > 0
                ? `${(pkg.tokens - pkg.bonus).toLocaleString()} tokens + ${pkg.bonus.toLocaleString()} bonus`
                : `${pkg.tokens.toLocaleString()} tokens added to your balance`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        tokens: String(pkg.tokens),
        packageId: pkg.id,
      },
      success_url: `${baseUrl}/deposit?success=1`,
      cancel_url: `${baseUrl}/deposit`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
