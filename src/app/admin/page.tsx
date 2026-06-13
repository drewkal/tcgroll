// src/app/admin/page.tsx
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Shield, Users, Package, DollarSign, TrendingUp, Edit, Receipt, Truck, Layers, AlertCircle, ArrowUp, ArrowDown, Minus, Share2, Palette, Swords } from 'lucide-react'
import { SeedBotsButton } from './seed-bots-button'

async function getAdminData() {
  const now = new Date()
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7); startOfWeek.setHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(now); startOfLastWeek.setDate(now.getDate() - 14); startOfLastWeek.setHours(0, 0, 0, 0)

  // Build last-14-days buckets for openings sparkline
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (13 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const [
    totalUsers, totalOpenings, revenueAgg, cases, recentUsers,
    newUsersThisWeek, newUsersLastWeek,
    openingsThisWeek, openingsLastWeek,
    revenueThisWeek, revenueLastWeek,
    pendingWithdrawals,
    recentOpenings,
    openBattles,
    completedBattles,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.caseOpening.count(),
    prisma.transaction.aggregate({ where: { type: 'DEPOSIT' }, _sum: { amount: true } }),
    prisma.cardCase.findMany({
      include: { _count: { select: { openings: true } } },
      orderBy: { price: 'asc' },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, balance: true, createdAt: true, role: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfWeek } } }),
    prisma.caseOpening.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.caseOpening.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfWeek } } }),
    prisma.transaction.aggregate({ where: { type: 'DEPOSIT', createdAt: { gte: startOfWeek } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'DEPOSIT', createdAt: { gte: startOfLastWeek, lt: startOfWeek } }, _sum: { amount: true } }),
    prisma.withdrawRequest.count({ where: { status: 'PENDING' } }),
    prisma.caseOpening.findMany({
      where: { createdAt: { gte: last14Days[0] } },
      select: { createdAt: true },
    }),
    prisma.battle.count({ where: { status: 'WAITING' } }),
    prisma.battle.count({ where: { status: 'COMPLETE' } }),
  ])

  // Bucket openings into 14 daily slots
  const openingsByDay = last14Days.map(dayStart => {
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1)
    return {
      label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: recentOpenings.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd).length,
    }
  })

  return {
    totalUsers, totalOpenings,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    cases, recentUsers,
    newUsersThisWeek, newUsersLastWeek,
    openingsThisWeek, openingsLastWeek,
    revenueThisWeek: revenueThisWeek._sum.amount ?? 0,
    revenueLastWeek: revenueLastWeek._sum.amount ?? 0,
    pendingWithdrawals,
    openingsByDay,
    openBattles,
    completedBattles,
  }
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const data = await getAdminData()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Shield size={28} className="text-yellow-400" />
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest">— ADMIN PANEL</p>
          <h1 className="font-display text-5xl tracking-wide text-white">DASHBOARD</h1>
        </div>
      </div>

      {/* Stats row 1 — totals + trends */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Users */}
        {(() => {
          const diff = data.newUsersThisWeek - data.newUsersLastWeek
          const up = diff > 0; const flat = diff === 0
          return (
            <div className="glass rounded-2xl border border-white/5 p-6">
              <Users size={20} className="text-blue-400 mb-3" />
              <div className="font-display text-4xl text-white">{data.totalUsers.toLocaleString()}</div>
              <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">TOTAL USERS</div>
              <div className={`flex items-center gap-1 mt-2 text-xs font-mono ${up ? 'text-green-400' : flat ? 'text-slate-500' : 'text-red-400'}`}>
                {up ? <ArrowUp size={11} /> : flat ? <Minus size={11} /> : <ArrowDown size={11} />}
                +{data.newUsersThisWeek} this week
              </div>
            </div>
          )
        })()}

        {/* Openings */}
        {(() => {
          const diff = data.openingsThisWeek - data.openingsLastWeek
          const up = diff > 0; const flat = diff === 0
          const pct = data.openingsLastWeek > 0 ? Math.round(Math.abs(diff) / data.openingsLastWeek * 100) : null
          return (
            <div className="glass rounded-2xl border border-white/5 p-6">
              <Package size={20} className="text-purple-400 mb-3" />
              <div className="font-display text-4xl text-white">{data.totalOpenings.toLocaleString()}</div>
              <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">TOTAL OPENINGS</div>
              <div className={`flex items-center gap-1 mt-2 text-xs font-mono ${up ? 'text-green-400' : flat ? 'text-slate-500' : 'text-red-400'}`}>
                {up ? <ArrowUp size={11} /> : flat ? <Minus size={11} /> : <ArrowDown size={11} />}
                {data.openingsThisWeek} this week{pct !== null ? ` (${up ? '+' : '-'}${pct}%)` : ''}
              </div>
            </div>
          )
        })()}

        {/* Revenue */}
        {(() => {
          const diff = data.revenueThisWeek - data.revenueLastWeek
          const up = diff > 0; const flat = diff === 0
          return (
            <div className="glass rounded-2xl border border-white/5 p-6">
              <DollarSign size={20} className="text-green-400 mb-3" />
              <div className="font-display text-3xl text-white">{formatCurrency(data.totalRevenue)}</div>
              <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">TOTAL REVENUE</div>
              <div className={`flex items-center gap-1 mt-2 text-xs font-mono ${up ? 'text-green-400' : flat ? 'text-slate-500' : 'text-red-400'}`}>
                {up ? <ArrowUp size={11} /> : flat ? <Minus size={11} /> : <ArrowDown size={11} />}
                {formatCurrency(data.revenueThisWeek)} this week
              </div>
            </div>
          )
        })()}

        {/* Pending withdrawals */}
        <Link href="/admin/withdrawals" className="glass rounded-2xl border border-white/5 p-6 hover:border-yellow-400/20 transition-colors block">
          <Truck size={20} className="text-yellow-400 mb-3" />
          <div className={`font-display text-4xl ${data.pendingWithdrawals > 0 ? 'text-yellow-400' : 'text-white'}`}>
            {data.pendingWithdrawals}
          </div>
          <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">PENDING WITHDRAWALS</div>
          {data.pendingWithdrawals > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs font-mono text-yellow-400">
              <AlertCircle size={11} /> Needs attention
            </div>
          )}
        </Link>
      </div>

      {/* Openings sparkline — last 14 days */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-yellow-400" />
          <h2 className="font-display text-xl tracking-wide text-white">OPENINGS — LAST 14 DAYS</h2>
        </div>
        {(() => {
          const max = Math.max(...data.openingsByDay.map(d => d.count), 1)
          return (
            <div className="flex items-end gap-1.5 h-20">
              {data.openingsByDay.map((day, i) => {
                const pct = (day.count / max) * 100
                const isToday = i === data.openingsByDay.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-800 border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-white whitespace-nowrap z-10">
                      {day.label}: {day.count}
                    </div>
                    <div className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(pct, 4)}%`,
                        backgroundColor: isToday ? '#facc15' : '#7c3aed',
                        opacity: day.count === 0 ? 0.2 : 1,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )
        })()}
        <div className="flex justify-between mt-2 text-xs font-mono text-slate-600">
          <span>{data.openingsByDay[0]?.label}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Battles */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-white tracking-wide flex items-center gap-2 mb-1">
              <Swords size={20} className="text-yellow-400" /> BATTLES
            </h2>
            <p className="text-xs font-mono text-slate-500">
              <span className="text-white">{data.openBattles}</span> open &nbsp;·&nbsp;
              <span className="text-white">{data.completedBattles}</span> completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/battles" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors">
              View Lobby
            </Link>
            <SeedBotsButton />
          </div>
        </div>
      </div>

      {/* Cases management */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-white tracking-wide flex items-center gap-2">
            <Package size={20} className="text-yellow-400" />
            CASES
          </h2>
          <div className="flex gap-2">
            <Link
              href="/admin/withdrawals"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors"
            >
              <Truck size={14} /> Withdrawals
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors"
            >
              <Receipt size={14} /> Orders
            </Link>
            <Link
              href="/admin/cards"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors"
            >
              <Layers size={14} /> Cards
            </Link>
            <Link
              href="/admin/branding"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors"
            >
              <Palette size={14} /> Branding
            </Link>
            <Link
              href="/admin/social"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors"
            >
              <Share2 size={14} /> Social
            </Link>
            <Link
              href="/admin/cases/new"
              className="btn-gold px-4 py-2 rounded-xl text-sm font-display tracking-wider"
            >
              + New Case
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                {['Name', 'Tier', 'Price', 'Openings', 'Active', 'Actions'].map(h => (
                  <th key={h} className="pb-3 pr-4 text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {data.cases.map(c => (
                <tr key={c.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{c.name}</td>
                  <td className="py-3 pr-4 font-mono text-slate-400 text-xs">{c.tier}</td>
                  <td className="py-3 pr-4 font-mono text-yellow-400">{formatCurrency(c.price)}</td>
                  <td className="py-3 pr-4 text-slate-300">{c._count.openings.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <span className={`rarity-badge ${c.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {c.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/admin/cases/${c.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-navy-700 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      <Edit size={12} /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent users */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <h2 className="font-display text-2xl text-white tracking-wide mb-6 flex items-center gap-2">
          <Users size={20} className="text-yellow-400" />
          RECENT USERS
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                {['Name', 'Email', 'Balance', 'Role', 'Joined'].map(h => (
                  <th key={h} className="pb-3 pr-4 text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {data.recentUsers.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{u.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{u.email}</td>
                  <td className="py-3 pr-4 font-mono text-yellow-400">{formatCurrency(u.balance)}</td>
                  <td className="py-3 pr-4">
                    <span className={`rarity-badge ${u.role === 'ADMIN' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs font-mono">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
