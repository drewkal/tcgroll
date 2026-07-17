'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Shield, Zap, Package, CreditCard, Gift, Wifi, ExternalLink, CheckCircle, XCircle, Ban } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EditBalanceButton } from '@/app/admin/edit-balance-button'

type Transaction = {
  id: string; amount: number; type: string; description: string | null
  createdAt: string; stripeId: string | null
}

type Opening = {
  id: string; totalCost: number; createdAt: string
  case: { name: string }
  openingCards: { card: { name: string; value: number; rarity: string } }[]
}

type UserDetail = {
  id: string; name: string | null; email: string; balance: number
  role: string; emailVerified: string | null; createdAt: string
  registrationIp: string | null; referralCode: string | null
  referralBonusPaid: boolean; password: string | null; image: string | null
  banned: boolean; bannedAt: string | null
  accounts: { provider: string }[]
  referredBy: { id: string; name: string | null; email: string } | null
  referrals: { id: string; name: string | null; email: string; createdAt: string; referralBonusPaid: boolean }[]
  transactions: Transaction[]
  openings: Opening[]
  _count: { openings: number; userCards: number; withdrawals: number }
}

const TX_COLORS: Record<string, string> = {
  DEPOSIT: 'text-green-400',
  PURCHASE: 'text-red-400',
  SALE: 'text-blue-400',
  REFUND: 'text-yellow-400',
  EXCHANGE: 'text-purple-400',
}

const RARITY_COLORS: Record<string, string> = {
  LEGENDARY: 'text-yellow-400', EPIC: 'text-purple-400',
  RARE: 'text-blue-400', UNCOMMON: 'text-green-400', COMMON: 'text-slate-400',
}

export function AdminUserDetailClient({ userId }: { userId: string }) {
  const [data, setData] = useState<{ user: UserDetail; totalSpent: number; totalDeposited: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'transactions' | 'openings' | 'referrals'>('transactions')
  const [banning, setBanning] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 font-mono">
        User not found.
      </div>
    )
  }

  const { user, totalSpent, totalDeposited } = data
  const isOAuth = user.accounts.length > 0

  const toggleBan = async () => {
    const action = user.banned ? 'unban' : 'ban'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    setBanning(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) setData(prev => prev ? { ...prev, user: { ...prev.user, banned: json.banned, bannedAt: json.banned ? new Date().toISOString() : null } } : prev)
    } finally {
      setBanning(false)
    }
  }
  const oauthProviders = user.accounts.map(a => a.provider)
  const signInMethod = isOAuth ? oauthProviders.join(', ') : 'Email / Password'

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest">— ADMIN / USERS</p>
          <h1 className="font-display text-3xl text-white tracking-wide">{user.name ?? user.email}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`rarity-badge ${user.role === 'ADMIN' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {user.role}
          </span>
          {user.emailVerified
            ? <span className="rarity-badge bg-green-500/20 text-green-400 flex items-center gap-1"><CheckCircle size={11} /> Verified</span>
            : <span className="rarity-badge bg-slate-500/20 text-slate-400 flex items-center gap-1"><XCircle size={11} /> Unverified</span>
          }
          {user.role !== 'ADMIN' && (
            <button
              onClick={toggleBan}
              disabled={banning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all disabled:opacity-50 ${
                user.banned
                  ? 'bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25'
                  : 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
              }`}
            >
              <Ban size={12} />
              {banning ? '…' : user.banned ? 'Unban' : 'Ban'}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl border border-white/5 p-4">
          <div className="text-xs font-mono text-slate-500 tracking-wider mb-1">BALANCE</div>
          <div className="font-display text-2xl text-yellow-400">{formatCurrency(user.balance)}</div>
          <div className="mt-1">
            <EditBalanceButton userId={user.id} name={user.name} currentBalance={user.balance} />
          </div>
        </div>
        <div className="glass rounded-xl border border-white/5 p-4">
          <div className="text-xs font-mono text-slate-500 tracking-wider mb-1">TOTAL DEPOSITED</div>
          <div className="font-display text-2xl text-green-400">{formatCurrency(totalDeposited)}</div>
        </div>
        <div className="glass rounded-xl border border-white/5 p-4">
          <div className="text-xs font-mono text-slate-500 tracking-wider mb-1">TOTAL SPENT</div>
          <div className="font-display text-2xl text-red-400">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="glass rounded-xl border border-white/5 p-4">
          <div className="text-xs font-mono text-slate-500 tracking-wider mb-1">OPENINGS</div>
          <div className="font-display text-2xl text-white">{user._count.openings}</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="glass rounded-2xl border border-white/5 p-6 grid sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400 font-mono">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Sign-in: <span className="text-white capitalize">{signInMethod}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wifi size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Registration IP: <span className="text-white font-mono">{user.registrationIp ?? '—'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Joined: <span className="text-white">{formatDate(new Date(user.createdAt))}</span></span>
          </div>
          {user.emailVerified && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-400">Verified: <span className="text-white">{formatDate(new Date(user.emailVerified))}</span></span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Gift size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Referral code: <span className="text-white font-mono">{user.referralCode ?? '—'}</span></span>
          </div>
          {user.referredBy ? (
            <div className="flex items-center gap-2 text-sm">
              <Gift size={14} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-400">Referred by:{' '}
                <Link href={`/admin/users/${user.referredBy.id}`} className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  {user.referredBy.name ?? user.referredBy.email}
                </Link>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Gift size={14} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-400">Referred by: <span className="text-white">—</span></span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Zap size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Referral bonus paid: <span className={user.referralBonusPaid ? 'text-green-400' : 'text-slate-400'}>{user.referralBonusPaid ? 'Yes' : 'No'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Cards held: <span className="text-white">{user._count.userCards}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Withdrawals: <span className="text-white">{user._count.withdrawals}</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 rounded-xl p-1 border border-white/5 w-fit">
        {(['transactions', 'openings', 'referrals'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all capitalize ${
              tab === t ? 'bg-yellow-400 text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t} {t === 'transactions' ? `(${user.transactions.length})` : t === 'openings' ? `(${user._count.openings})` : `(${user.referrals.length})`}
          </button>
        ))}
      </div>

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          {user.transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-sm">No transactions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Type', 'Description', 'Amount', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {user.transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`rarity-badge text-xs font-mono ${TX_COLORS[tx.type] ?? 'text-slate-400'} bg-white/5`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300 max-w-xs truncate">
                        {tx.description ?? '—'}
                        {tx.stripeId && (
                          <span className="ml-2 text-xs text-slate-600 font-mono">{tx.stripeId.slice(0, 12)}…</span>
                        )}
                      </td>
                      <td className={`px-5 py-3 font-mono font-semibold ${tx.type === 'PURCHASE' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'PURCHASE' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">
                        {formatDate(new Date(tx.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Openings */}
      {tab === 'openings' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          {user.openings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-sm">No openings</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Case', 'Cards', 'Value', 'Cost', 'P&L', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {user.openings.map(o => {
                    const value = o.openingCards.reduce((s, oc) => s + oc.card.value, 0)
                    const pnl = value - o.totalCost
                    const bestRarity = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'].find(r =>
                      o.openingCards.some(oc => oc.card.rarity === r)
                    ) ?? 'COMMON'
                    return (
                      <tr key={o.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3 text-white">{o.case.name}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-mono ${RARITY_COLORS[bestRarity]}`}>
                            {o.openingCards.length} cards
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-yellow-400">{formatCurrency(value)}</td>
                        <td className="px-5 py-3 font-mono text-slate-400">{formatCurrency(o.totalCost)}</td>
                        <td className={`px-5 py-3 font-mono font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">
                          {formatDate(new Date(o.createdAt))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {user._count.openings > 20 && (
            <div className="px-5 py-3 border-t border-white/5 text-xs font-mono text-slate-500 text-center">
              Showing 20 most recent of {user._count.openings} total openings
            </div>
          )}
        </div>
      )}

      {/* Referrals */}
      {tab === 'referrals' && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          {user.referrals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-sm">No referrals yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Name', 'Email', 'Joined', 'Bonus Paid'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {user.referrals.map(r => (
                    <tr key={r.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/admin/users/${r.id}`} className="text-white hover:text-yellow-400 transition-colors flex items-center gap-1.5">
                          {r.name ?? '—'} <ExternalLink size={11} className="text-slate-600" />
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{r.email}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">{formatDate(new Date(r.createdAt))}</td>
                      <td className="px-5 py-3">
                        <span className={`rarity-badge ${r.referralBonusPaid ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-500'}`}>
                          {r.referralBonusPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
