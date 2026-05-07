// src/lib/stripe.ts
import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export const CREDIT_PACKAGES = [
  { id: 'credits_5', credits: 5, price: 500, label: '$5.00', popular: false },
  { id: 'credits_10', credits: 10, price: 1000, label: '$10.00', popular: false },
  { id: 'credits_25', credits: 25, price: 2500, label: '$25.00', popular: true },
  { id: 'credits_50', credits: 50, price: 5000, label: '$50.00', popular: false },
  { id: 'credits_100', credits: 100, price: 10000, label: '$100.00', popular: false },
]
