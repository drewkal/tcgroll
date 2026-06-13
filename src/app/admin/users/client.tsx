'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EditBalanceButton } from '@/app/admin/edit-balance-button'

type User = {
  id: string; name: string | null; email: string
  balance: number; role: string; createdAt: string; emailVerified: string | null
}

export function AdminUsersClient() {
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [users, setUsers]     = useState<User[]>([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&page=${p}`)
      const data = await res.json()
      setUsers(data.users); setTotal(data.total); setPages(data.pages)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_(search, page) }, [page, fetch_])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch_(search, 1) }, 300)
    return () => clearTimeout(t)
  }, [search, fetch_])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest">— ADMIN</p>
          <h1 className="font-display text-4xl text-white tracking-wide flex items-center gap-3">
            <Users size={32} className="text-yellow-400" /> USERS
          </h1>
        </div>
        <div className="ml-auto text-sm font-mono text-slate-500">{total.toLocaleString()} total</div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-navy-800 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Name', 'Email', 'Balance', 'Verified', 'Role', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-mono text-slate-500 tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-mono text-sm">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-mono text-sm">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 text-white font-medium whitespace-nowrap">{u.name ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
                  <td className="px-5 py-3 font-mono text-yellow-400 whitespace-nowrap">
                    {formatCurrency(u.balance)}
                    <EditBalanceButton userId={u.id} name={u.name} currentBalance={u.balance} />
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rarity-badge ${u.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-500'}`}>
                      {u.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rarity-badge ${u.role === 'ADMIN' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">{formatDate(new Date(u.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
            <span className="text-xs font-mono text-slate-500">
              Page {page} of {pages} — {total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
