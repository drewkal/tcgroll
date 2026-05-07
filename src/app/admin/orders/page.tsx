// src/app/admin/orders/page.tsx
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Receipt, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPES = ['ALL', 'DEPOSIT', 'PURCHASE', 'SALE', 'REFUND'] as const

const typeStyles: Record<string, string> = {
  DEPOSIT:  'bg-green-500/20 text-green-400',
  PURCHASE: 'bg-red-500/20 text-red-400',
  SALE:     'bg-blue-500/20 text-blue-400',
  REFUND:   'bg-slate-500/20 text-slate-400',
}

const typeIcons: Record<string, React.ElementType> = {
  DEPOSIT:  ArrowDownLeft,
  PURCHASE: Package,
  SALE:     ArrowUpRight,
  REFUND:   Receipt,
}

async function getOrders(type?: string) {
  const where = type && type !== 'ALL' ? { type: type as any } : {}

  const [transactions, stats] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return { transactions, stats }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const { type } = await searchParams
  const selectedType = type?.toUpperCase() ?? 'ALL'
  const { transactions, stats } = await getOrders(selectedType)

  const statMap = Object.fromEntries(stats.map(s => [s.type, s]))

  const statCards = [
    {
      label: 'Total Deposits',
      value: formatCurrency(statMap.DEPOSIT?._sum.amount ?? 0),
      count: statMap.DEPOSIT?._count ?? 0,
      icon: ArrowDownLeft,
      color: 'text-green-400',
    },
    {
      label: 'Total Purchases',
      value: formatCurrency(Math.abs(statMap.PURCHASE?._sum.amount ?? 0)),
      count: statMap.PURCHASE?._count ?? 0,
      icon: Package,
      color: 'text-red-400',
    },
    {
      label: 'Total Sales',
      value: formatCurrency(statMap.SALE?._sum.amount ?? 0),
      count: statMap.SALE?._count ?? 0,
      icon: ArrowUpRight,
      color: 'text-blue-400',
    },
    {
      label: 'Refunds',
      value: formatCurrency(statMap.REFUND?._sum.amount ?? 0),
      count: statMap.REFUND?._count ?? 0,
      icon: Receipt,
      color: 'text-slate-400',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Receipt size={28} className="text-yellow-400" />
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest">— ADMIN PANEL</p>
          <h1 className="font-display text-5xl tracking-wide text-white">ORDERS</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, count, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl border border-white/5 p-6">
            <Icon size={24} className={cn(color, 'mb-3')} />
            <div className="font-display text-3xl text-white">{value}</div>
            <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">{label}</div>
            <div className="text-xs font-mono text-slate-600 mt-1">{count} transactions</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-display text-2xl text-white tracking-wide flex items-center gap-2">
            <TrendingUp size={20} className="text-yellow-400" />
            TRANSACTIONS
          </h2>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <a
                key={t}
                href={t === 'ALL' ? '/admin/orders' : `/admin/orders?type=${t.toLowerCase()}`}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-mono text-xs transition-all',
                  selectedType === t
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'bg-navy-800 text-slate-400 border border-white/10 hover:border-yellow-400/30 hover:text-yellow-400'
                )}
              >
                {t}
              </a>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-display text-xl">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/5">
                  {['User', 'Type', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} className="pb-3 pr-4 text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {transactions.map(tx => {
                  const Icon = typeIcons[tx.type] ?? Receipt
                  return (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="text-white text-sm">{tx.user.name ?? '—'}</div>
                        <div className="text-slate-500 font-mono text-xs">{tx.user.email}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn('rarity-badge inline-flex items-center gap-1', typeStyles[tx.type])}>
                          <Icon size={10} />
                          {tx.type}
                        </span>
                      </td>
                      <td className={cn(
                        'py-3 pr-4 font-mono font-semibold',
                        tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-xs max-w-xs truncate">
                        {tx.description ?? '—'}
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
