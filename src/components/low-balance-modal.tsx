'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Zap, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { TOKEN_PACKAGES } from '@/lib/stripe'
import toast from 'react-hot-toast'

const FEATURED_PACKAGES = TOKEN_PACKAGES.slice(0, 3)

interface Props {
  balance: number
  onClose: () => void
}

export function LowBalanceModal({ balance, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleBuy(packageId: string) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-yellow-400/20 p-6 relative"
        style={{
          background: 'linear-gradient(160deg, #0f1629 0%, #080c18 100%)',
          boxShadow: '0 0 60px rgba(251,191,36,0.12)',
          animation: 'slide-up 0.25s ease-out',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="text-2xl mb-2">⚡</div>
          <h2 className="font-display text-2xl text-white tracking-wide">RUNNING LOW</h2>
          <p className="text-slate-400 text-sm mt-1">
            Your balance is <span className="text-yellow-400 font-mono">{formatCurrency(balance)}</span> — top up to keep opening.
          </p>
        </div>

        {/* Packages */}
        <div className="space-y-2 mb-5">
          {FEATURED_PACKAGES.map(pkg => {
            const isLoading = loading === pkg.id
            return (
              <button
                key={pkg.id}
                onClick={() => handleBuy(pkg.id)}
                disabled={!!loading}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all disabled:opacity-60 group"
                style={{
                  background: pkg.popular ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: pkg.popular ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-yellow-400">🪙 {pkg.tokens.toLocaleString()}</span>
                  {pkg.bonus > 0 && (
                    <span className="text-[11px] font-mono text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                      +{pkg.bonus.toLocaleString()} bonus
                    </span>
                  )}
                  {pkg.popular && (
                    <span className="text-[11px] font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5">
                      BEST VALUE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-white">{pkg.label}</span>
                  {isLoading
                    ? <Loader2 size={14} className="animate-spin text-yellow-400" />
                    : <Zap size={14} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  }
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { onClose(); router.push('/deposit') }}
          className="w-full text-center text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
        >
          See all packages →
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
