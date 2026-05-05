// src/app/profile/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CREDIT_PACKAGES } from '@/lib/stripe'
import { User, TrendingUp, Package, DollarSign, CreditCard, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type Stats = {
  totalCards: number
  totalOpenings: number
  totalSpent: number
  totalDeposited: number
  currentBalance: number
  rarityCount: Record<string, number>
}

type Transaction = {
  id: string
  amount: number
  type: string
  description: string | null
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<Stats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [depositLoading, setDepositLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    const deposit = searchParams.get('deposit')
    if (deposit === 'success') toast.success('Deposit successful! Your balance has been updated.')
    if (deposit === 'cancelled') toast.error('Deposit cancelled.')
  }, [searchParams])

  useEffect(() => {
    if (!session) return
    fetch('/api/user/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data.stats)
        setTransactions(data.transactions)
      })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false))
  }, [session])

  const handleDeposit = async (packageId: string) => {
    setDepositLoading(packageId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      window.location.href = data.url
    } catch {
      toast.error('Failed to initiate deposit')
    } finally {
      setDepositLoading(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const rarityOrder = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON']
  const rarityColors: Record<string, string> = {
    LEGENDARY: '#f59e0b', EPIC: '#a855f7', RARE: '#3b82f6', UNCOMMON: '#22c55e', COMMON: '#9ca3af'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">

      {/* Profile header */}
      <div className="glass rounded-2xl border border-white/5 p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border border-yellow-400/30 flex items-center justify-center">
          <User size={36} className="text-yellow-400" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-4xl text-white tracking-wide">{session?.user.name}</h1>
          <p className="text-slate-400 font-mono text-sm">{session?.user.email}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-slate-500 tracking-wider mb-1">BALANCE</div>
          <div className="font-display text-4xl text-yellow-400 text-glow-gold">
            {formatCurrency(stats?.currentBalance ?? session?.user.balance ?? 0)}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cases Opened', value: stats?.totalOpenings ?? 0, icon: Package, format: (v: number) => v.toString() },
          { label: 'Cards Collected', value: stats?.totalCards ?? 0, icon: Zap, format: (v: number) => v.toString() },
          { label: 'Total Spent', value: stats?.totalSpent ?? 0, icon: TrendingUp, format: formatCurrency },
          { label: 'Total Deposited', value: stats?.totalDeposited ?? 0, icon: CreditCard, format: formatCurrency },
        ].map(({ label, value, icon: Icon, format }) => (
          <div key={label} className="glass rounded-xl border border-white/5 p-5">
            <Icon size={20} className="text-yellow-400 mb-3" />
            <div className="font-display text-3xl text-white">{format(value)}</div>
            <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Rarity breakdown */}
      {stats?.rarityCount && Object.keys(stats.rarityCount).length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-6">
          <h2 className="font-display text-2xl text-white tracking-wide mb-5">COLLECTION BREAKDOWN</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {rarityOrder.map(rarity => {
              const count = stats.rarityCount[rarity] ?? 0
              const color = rarityColors[rarity]
              return (
                <div
                  key={rarity}
                  className="flex flex-col items-center p-4 rounded-xl border"
                  style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
                >
                  <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                  <div className="font-display text-2xl text-white">{count}</div>
                  <div className="text-xs font-mono mt-1" style={{ color }}>{rarity}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Deposit section */}
      <div className="glass rounded-2xl border border-yellow-400/10 p-6">
        <h2 className="font-display text-2xl text-white tracking-wide mb-2">ADD FUNDS</h2>
        <p className="text-slate-400 text-sm mb-6">Powered by Stripe. All payments are secure and encrypted.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CREDIT_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => handleDeposit(pkg.id)}
              disabled={depositLoading !== null}
              className={cn(
                'relative flex flex-col items-center p-4 rounded-xl border transition-all',
                pkg.popular
                  ? 'border-yellow-400/50 bg-yellow-400/10 hover:bg-yellow-400/20'
                  : 'border-white/10 bg-navy-800 hover:border-yellow-400/30',
                depositLoading === pkg.id && 'opacity-50',
              )}
            >
              {pkg.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  POPULAR
                </div>
              )}
              <DollarSign size={18} className="text-yellow-400 mb-2" />
              <div className="font-display text-2xl text-white">${pkg.credits}</div>
              <div className="text-xs text-slate-400 font-mono">{pkg.label}</div>
              {depositLoading === pkg.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h2 className="font-display text-2xl text-white tracking-wide mb-5">TRANSACTION HISTORY</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                    tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' :
                    tx.type === 'SALE' ? 'bg-blue-500/20 text-blue-400' :
                    tx.type === 'PURCHASE' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400',
                  )}>
                    {tx.type === 'DEPOSIT' ? '↑' : tx.type === 'SALE' ? '→' : '↓'}
                  </div>
                  <div>
                    <div className="text-sm text-white">{tx.description ?? tx.type}</div>
                    <div className="text-xs text-slate-500 font-mono">{formatDate(tx.createdAt)}</div>
                  </div>
                </div>
                <div className={cn(
                  'font-mono font-semibold',
                  tx.amount > 0 ? 'text-green-400' : 'text-red-400',
                )}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
