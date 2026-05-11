// src/lib/stripe.ts
import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export const TOKEN_PACKAGES = [
  { id: 'tokens_500',   tokens: 500,   price: 499,   label: '$4.99',  bonus: 0,    popular: false },
  { id: 'tokens_1200',  tokens: 1200,  price: 999,   label: '$9.99',  bonus: 200,  popular: false },
  { id: 'tokens_3000',  tokens: 3000,  price: 2499,  label: '$24.99', bonus: 500,  popular: true  },
  { id: 'tokens_7000',  tokens: 7000,  price: 4999,  label: '$49.99', bonus: 2000, popular: false },
  { id: 'tokens_15000', tokens: 15000, price: 9999,  label: '$99.99', bonus: 5000, popular: false },
]
