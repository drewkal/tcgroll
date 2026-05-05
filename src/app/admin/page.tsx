// src/app/admin/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Shield, Users, Package, DollarSign, TrendingUp, Edit } from 'lucide-react'

async function getAdminData() {
  const [totalUsers, totalOpenings, revenueAgg, cases, recentUsers] = await Promise.all([
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
  ])
  return {
    totalUsers,
    totalOpenings,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    cases,
    recentUsers,
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Users', value: data.totalUsers.toString(), icon: Users, color: 'text-blue-400' },
          { label: 'Total Openings', value: data.totalOpenings.toLocaleString(), icon: Package, color: 'text-purple-400' },
          { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl border border-white/5 p-6">
            <Icon size={24} className={`${color} mb-3`} />
            <div className="font-display text-4xl text-white">{value}</div>
            <div className="text-xs font-mono text-slate-500 tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Cases management */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-white tracking-wide flex items-center gap-2">
            <Package size={20} className="text-yellow-400" />
            CASES
          </h2>
          <Link
            href="/admin/cases/new"
            className="btn-gold px-4 py-2 rounded-xl text-sm font-display tracking-wider"
          >
            + New Case
          </Link>
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
