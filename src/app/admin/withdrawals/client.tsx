// src/app/admin/withdrawals/client.tsx
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { Truck, ChevronDown, ChevronUp, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-500/20 text-yellow-400',
  PROCESSING: 'bg-blue-500/20 text-blue-400',
  SHIPPED:    'bg-purple-500/20 text-purple-400',
  DELIVERED:  'bg-green-500/20 text-green-400',
  CANCELLED:  'bg-red-500/20 text-red-400',
}

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

type Card = { id: string; name: string; rarity: string; value: number; imageUrl: string | null }
type WithdrawCard = { id: string; userCard: { card: Card } }
type Withdrawal = {
  id: string
  status: string
  fullName: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string | null
  notes: string | null
  trackingNumber: string | null
  adminNotes: string | null
  createdAt: string
  user: { name: string | null; email: string }
  cards: WithdrawCard[]
}

function WithdrawalRow({ withdrawal: init }: { withdrawal: Withdrawal }) {
  const [w,        setW]        = useState(init)
  const [open,     setOpen]     = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [tracking, setTracking] = useState(init.trackingNumber ?? '')
  const [notes,    setNotes]    = useState(init.adminNotes ?? '')
  const [status,   setStatus]   = useState(init.status)

  const totalValue = w.cards.reduce((s, wc) => s + wc.userCard.card.value, 0)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/withdrawals/${w.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber: tracking, adminNotes: notes }),
      })
      if (!res.ok) { toast.error('Failed to save'); return }
      setW(prev => ({ ...prev, status, trackingNumber: tracking || null, adminNotes: notes || null }))
      toast.success('Saved')
    } catch {
      toast.error('Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass rounded-xl border border-white/5 overflow-hidden">
      {/* Row header */}
      <button onClick={() => setOpen(o => !o)} className="w-full text-left p-5 hover:bg-white/2 transition-colors">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{w.fullName}</span>
              <span className={cn('rarity-badge text-xs', STATUS_STYLES[w.status])}>{w.status}</span>
            </div>
            <div className="text-slate-500 font-mono text-xs mt-0.5">{w.user.email} · {formatDate(w.createdAt)}</div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-white font-mono">{w.cards.length}</div>
              <div className="text-slate-500 text-xs">cards</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-mono">{formatCurrency(totalValue)}</div>
              <div className="text-slate-500 text-xs">value</div>
            </div>
            {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/5 p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping address */}
            <div>
              <h4 className="text-xs font-mono text-slate-500 tracking-widest mb-2">SHIPPING ADDRESS</h4>
              <div className="text-sm text-slate-300 space-y-0.5">
                <p className="text-white font-medium">{w.fullName}</p>
                <p>{w.address}</p>
                <p>{w.city}, {w.state} {w.zipCode}</p>
                <p>{w.country}</p>
                {w.phone && <p className="text-slate-400">{w.phone}</p>}
                {w.email && <p className="text-slate-400 font-mono text-xs">{w.email}</p>}
                {w.notes && (
                  <div className="mt-2 p-2 rounded-lg bg-white/3 text-slate-400 text-xs italic">{w.notes}</div>
                )}
              </div>
            </div>

            {/* Admin controls */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono text-slate-500 tracking-widest">MANAGE</h4>
              <div>
                <label className="text-xs font-mono text-slate-400 tracking-wider block mb-1">STATUS</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 tracking-wider block mb-1">TRACKING NUMBER</label>
                <input
                  value={tracking}
                  onChange={e => setTracking(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 tracking-wider block mb-1">ADMIN NOTES</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                  className="w-full bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50 placeholder-slate-600 resize-none"
                />
              </div>
              {status === 'SHIPPED' && w.status !== 'SHIPPED' && tracking && (
                <p className="text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Truck size={12} /> Shipping confirmation email will be sent on save
                </p>
              )}
              <button
                onClick={save}
                disabled={saving}
                className="btn-gold w-full py-2.5 rounded-xl text-sm font-display tracking-wider flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h4 className="text-xs font-mono text-slate-500 tracking-widest mb-3">CARDS ({w.cards.length})</h4>
            <div className="flex flex-wrap gap-2">
              {w.cards.map(wc => {
                const card  = wc.userCard.card
                const color = getRarityColor(card.rarity)
                return (
                  <div key={wc.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                    style={{ borderColor: color + '40', background: color + '10' }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span style={{ color }} className="font-mono text-xs">{card.rarity.slice(0, 3)}</span>
                    <span className="text-white text-xs">{card.name}</span>
                    <span className="text-slate-400 font-mono text-xs">{formatCurrency(card.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminWithdrawalsClient({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const [filter, setFilter] = useState('ALL')

  const counts = withdrawals.reduce<Record<string, number>>((acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1
    return acc
  }, {})

  const filtered = filter === 'ALL' ? withdrawals : withdrawals.filter(w => w.status === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Truck size={28} className="text-yellow-400" />
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest">— ADMIN PANEL</p>
          <h1 className="font-display text-5xl tracking-wide text-white">WITHDRAWALS</h1>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-2 rounded-lg font-mono text-xs transition-all border',
              filter === s ? 'bg-yellow-400 text-black font-bold border-yellow-400' : 'bg-navy-800 border-white/10 text-slate-400 hover:border-yellow-400/30 hover:text-yellow-400'
            )}
          >
            {s} {s !== 'ALL' && counts[s] ? `(${counts[s]})` : s === 'ALL' ? `(${withdrawals.length})` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-display text-2xl">No withdrawal requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => <WithdrawalRow key={w.id} withdrawal={w} />)}
        </div>
      )}
    </div>
  )
}
