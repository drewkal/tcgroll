'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Swords, Plus, Zap, Clock, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { GAMES } from '@/lib/games'

type Case = { id: string; name: string; price: number; game: string; slug: string }
type Battle = {
  id: string; wager: number; createdAt: string
  creator: { id: string; name: string | null }
  case: Case & { imageUrl: string | null }
}

const GAME_COLORS: Record<string, string> = {
  POKEMON: '#f59e0b', ONE_PIECE: '#ef4444', MAGIC: '#8b5cf6', DRAGON_BALL: '#f97316',
}

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  const m = Math.floor(diff / 60000)
  return m > 0 ? `${m}m left` : 'Expiring'
}

export function BattleLobbyClient({ battles, cases }: { battles: (Battle & { expiresAt: string })[]; cases: Case[] }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCase, setSelectedCase] = useState('')
  const [wager, setWager] = useState('0')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!session) { router.push('/login'); return }
    if (!selectedCase) { toast.error('Select a case'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: selectedCase, wager: Number(wager) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      router.push(`/battles/${data.id}`)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (battleId: string) => {
    if (!session) { router.push('/login'); return }
    setJoining(battleId)
    try {
      const res = await fetch(`/api/battles/${battleId}/join`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      router.push(`/battles/${battleId}`)
    } finally {
      setJoining(null)
    }
  }

  const selectedCaseData = cases.find(c => c.id === selectedCase)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— HEAD TO HEAD</p>
          <h1 className="font-display text-5xl md:text-6xl tracking-wide text-white flex items-center gap-4">
            <Swords size={48} className="text-yellow-400" /> BATTLES
          </h1>
          <p className="text-slate-400 mt-3 max-w-md">Challenge another player. Each opens the same case — highest total card value wins the wager.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-gold px-5 py-3 rounded-xl font-display tracking-wider flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Create Battle
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass rounded-2xl border border-yellow-400/20 p-6 mb-8">
          <h2 className="font-display text-2xl text-white tracking-wide mb-5">NEW BATTLE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">SELECT CASE</label>
              <select
                value={selectedCase}
                onChange={e => setSelectedCase(e.target.value)}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50 transition-colors text-sm"
              >
                <option value="">Choose a case...</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {formatCurrency(c.price)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">WAGER (OPTIONAL)</label>
              <input
                type="number" min="0" step="100" value={wager}
                onChange={e => setWager(e.target.value)}
                placeholder="0"
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Extra tokens winner takes. 0 = free battle.</p>
            </div>
          </div>
          {selectedCaseData && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 mb-4 text-sm">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-slate-400">Total cost: <span className="text-yellow-400 font-mono">{formatCurrency(selectedCaseData.price + (Number(wager) || 0))}</span></span>
              <span className="text-slate-600 ml-auto">Case {formatCurrency(selectedCaseData.price)} + wager {formatCurrency(Number(wager) || 0)}</span>
            </div>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || !selectedCase}
            className="btn-gold px-8 py-3 rounded-xl font-display tracking-wider flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
            {creating ? 'Creating...' : 'Create Battle'}
          </button>
        </div>
      )}

      {/* Open battles */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-slate-500 tracking-widest">
          {battles.length} OPEN BATTLE{battles.length !== 1 ? 'S' : ''}
        </p>

        {battles.length === 0 ? (
          <div className="glass rounded-2xl border border-white/5 p-16 text-center">
            <Swords size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="font-display text-2xl text-slate-500 tracking-wide">NO OPEN BATTLES</p>
            <p className="text-slate-600 text-sm mt-2">Create one and challenge the world.</p>
          </div>
        ) : (
          battles.map(battle => {
            const color = GAME_COLORS[battle.case.game] ?? '#fbbf24'
            const isOwn = session?.user?.id === battle.creator.id
            return (
              <div
                key={battle.id}
                className="glass rounded-2xl border border-white/5 p-5 flex items-center gap-4 hover:border-white/10 transition-colors"
              >
                {/* Game color dot */}
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display text-white tracking-wide">{battle.case.name}</span>
                    {battle.wager > 0 && (
                      <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                        🪙 {battle.wager.toLocaleString()} wager
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                    <span>{battle.creator.name ?? 'Unknown'} challenges you</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {timeLeft(battle.expiresAt)}</span>
                  </div>
                </div>

                {/* Cost */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="font-mono text-sm text-yellow-400">{formatCurrency(battle.case.price + battle.wager)}</div>
                  <div className="text-xs text-slate-600">to join</div>
                </div>

                {/* Action */}
                {isOwn ? (
                  <Link href={`/battles/${battle.id}`} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-mono transition-all">
                    View
                  </Link>
                ) : (
                  <button
                    onClick={() => handleJoin(battle.id)}
                    disabled={!!joining}
                    className="btn-gold px-5 py-2 rounded-xl text-sm font-display tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {joining === battle.id ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
                    Join
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
