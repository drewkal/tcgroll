// src/app/deposit/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TOKEN_PACKAGES } from '@/lib/stripe'
import { formatCurrency } from '@/lib/utils'
import { Zap, Check, Loader2, ShieldCheck, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { Suspense } from 'react'

function DepositContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast.success('Tokens added to your balance!')
      update() // refresh session balance
    }
  }, [searchParams, update])

  async function handleBuy(packageId: string) {
    if (!session) { router.push('/login'); return }
    setLoading(packageId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-yellow-400" /></div>
  }

  return (
    <div className="min-h-screen px-4 py-16 max-w-5xl mx-auto">

      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— ADD BALANCE</p>
        <h1 className="font-display text-6xl tracking-wide text-white mb-4">BUY TOKENS</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Tokens power everything on TCGRoll — open cases, exchange cards, and grow your collection.
        </p>
        {session && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-mono text-sm">
            Current balance: {formatCurrency(session.user.balance ?? 0)}
          </div>
        )}
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-16">
        {TOKEN_PACKAGES.map(pkg => {
          const baseTokens = pkg.tokens - pkg.bonus
          const isLoading = loading === pkg.id

          return (
            <div
              key={pkg.id}
              className="relative glass rounded-2xl border p-6 flex flex-col transition-all"
              style={{
                borderColor: pkg.popular ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)',
                boxShadow: pkg.popular ? '0 0 30px rgba(251,191,36,0.1)' : 'none',
              }}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-display tracking-wider whitespace-nowrap">
                  BEST VALUE
                </div>
              )}

              <div className="text-center mb-5">
                <div className="font-display text-5xl text-yellow-400 mb-1">
                  🪙 {pkg.tokens.toLocaleString()}
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5 inline-block mb-1">
                    +{pkg.bonus.toLocaleString()} bonus
                  </div>
                )}
                <div className="text-3xl font-display text-white mt-2">{pkg.label}</div>
                {pkg.bonus > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    Base: {baseTokens.toLocaleString()} + {pkg.bonus.toLocaleString()} free
                  </div>
                )}
              </div>

              <div className="flex-1" />

              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={!!loading}
                className="w-full py-3 rounded-xl font-display tracking-wider text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{
                  background: pkg.popular
                    ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                    : 'rgba(255,255,255,0.06)',
                  color: pkg.popular ? '#000' : '#fff',
                }}
              >
                {isLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <><Zap size={14} fill={pkg.popular ? '#000' : 'currentColor'} /> Buy Now</>
                }
              </button>
            </div>
          )
        })}
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[
          { icon: Lock, text: 'Secure checkout via Stripe' },
          { icon: ShieldCheck, text: 'Tokens added instantly' },
          { icon: Check, text: 'No subscriptions, pay once' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-slate-500 text-sm justify-center">
            <Icon size={16} className="text-slate-600 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>

      <p className="text-center text-slate-600 text-xs mt-8 max-w-lg mx-auto">
        Tokens are virtual in-platform currency with no real-world monetary value. All purchases are final.
        By purchasing you agree to our{' '}
        <a href="/terms" className="text-slate-500 hover:text-yellow-400 transition-colors">Terms of Service</a>.
      </p>
    </div>
  )
}

export default function DepositPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-yellow-400" /></div>}>
      <DepositContent />
    </Suspense>
  )
}
