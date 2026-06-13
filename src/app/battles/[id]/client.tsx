'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Swords, Copy, Zap, Loader2, Trophy, Clock, RotateCcw, ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { CardDisplay } from '@/components/cards/card-display'

type CardSummary = { id: string; name: string; rarity: string; value: number; imageUrl: string | null }
type Battle = {
  id: string; status: string; wager: number; winnerId: string | null
  creatorId: string; creator: { id: string; name: string | null }
  creatorValue: number | null; creatorCards: CardSummary[] | null
  joinerId: string | null; joiner: { id: string; name: string | null } | null
  joinerValue: number | null; joinerCards: CardSummary[] | null
  case: { id: string; name: string; price: number; game: string; slug: string }
  expiresAt: string
}

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Waiting for opponent…',
  READY: 'Both players ready — open your case!',
  COMPLETE: 'Battle complete!',
  CANCELLED: 'Battle cancelled',
  EXPIRED: 'Battle expired',
}

export function BattleRoomClient({ initialBattle }: { initialBattle: Battle }) {
  const { data: session } = useSession()
  const [battle, setBattle] = useState<Battle>(initialBattle)
  const [opening, setOpening] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const isCreator  = session?.user?.id === battle.creatorId
  const isJoiner   = session?.user?.id === battle.joinerId
  const isParticipant = isCreator || isJoiner
  const myCards    = isCreator ? battle.creatorCards : battle.joinerCards
  const oppCards   = isCreator ? battle.joinerCards  : battle.creatorCards
  const myValue    = isCreator ? battle.creatorValue  : battle.joinerValue
  const oppValue   = isCreator ? battle.joinerValue   : battle.creatorValue
  const opponent   = isCreator ? battle.joiner        : battle.creator
  const iWon       = battle.winnerId === session?.user?.id

  // Poll for updates while battle is active
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/${battle.id}`)
      if (res.ok) {
        const data = await res.json()
        setBattle(data)
      }
    } catch {}
  }, [battle.id])

  useEffect(() => {
    if (battle.status === 'COMPLETE' || battle.status === 'CANCELLED' || battle.status === 'EXPIRED') return
    const interval = setInterval(poll, 2500)
    return () => clearInterval(interval)
  }, [battle.status, poll])

  const handleOpen = async () => {
    setOpening(true)
    try {
      const res = await fetch(`/api/battles/${battle.id}/open`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setBattle(data)
    } finally {
      setOpening(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/battles/${battle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error((await res.json()).error); return }
      setBattle(b => ({ ...b, status: 'CANCELLED' }))
      toast.success('Battle cancelled — tokens refunded')
    } finally {
      setCancelling(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/battles/${battle.id}`)
    toast.success('Link copied!')
  }

  const hasOpened = isCreator ? !!battle.creatorCards : !!battle.joinerCards

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/battles" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> All Battles
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-yellow-400 font-mono text-xs tracking-widest mb-1">CASE BATTLE</p>
          <h1 className="font-display text-3xl md:text-4xl text-white tracking-wide">{battle.case.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{STATUS_LABEL[battle.status]}</p>
        </div>
        {battle.wager > 0 && (
          <div className="text-center glass rounded-2xl border border-yellow-400/20 px-6 py-3">
            <div className="font-display text-3xl text-yellow-400">{formatCurrency(battle.wager * 2)}</div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">PRIZE POOL</div>
          </div>
        )}
      </div>

      {/* WAITING state */}
      {battle.status === 'WAITING' && (
        <div className="glass rounded-2xl border border-yellow-400/20 p-10 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-5">
            <Clock size={28} className="text-yellow-400 animate-pulse" />
          </div>
          <p className="font-display text-2xl text-white tracking-wide mb-2">WAITING FOR OPPONENT</p>
          <p className="text-slate-400 text-sm mb-6">Share this link to challenge someone:</p>
          <div className="flex items-center gap-3 max-w-md mx-auto mb-6">
            <div className="flex-1 bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-mono truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/battles/${battle.id}` : `tcgroll.com/battles/${battle.id}`}
            </div>
            <button onClick={copyLink} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-sm">
              <Copy size={14} /> Copy
            </button>
          </div>
          {isCreator && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs font-mono text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto"
            >
              {cancelling ? <Loader2 size={11} className="animate-spin" /> : null}
              Cancel & refund
            </button>
          )}
        </div>
      )}

      {/* READY / in-progress state */}
      {(battle.status === 'READY' || (battle.status === 'COMPLETE' && (battle.creatorCards || battle.joinerCards))) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {[
            { label: battle.creator.name ?? 'Creator', cards: battle.creatorCards, value: battle.creatorValue, playerId: battle.creatorId },
            { label: battle.joiner?.name ?? 'Opponent',  cards: battle.joinerCards,  value: battle.joinerValue,  playerId: battle.joinerId },
          ].map(({ label, cards, value, playerId }) => {
            const isMe = session?.user?.id === playerId
            const won  = battle.status === 'COMPLETE' && battle.winnerId === playerId
            return (
              <div
                key={playerId ?? label}
                className="glass rounded-2xl border p-5"
                style={{ borderColor: won ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {won && <Trophy size={16} className="text-yellow-400" />}
                    <span className="font-display text-xl text-white tracking-wide">{label}</span>
                    {isMe && <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">YOU</span>}
                  </div>
                  {value !== null && value !== undefined && (
                    <span className={`font-mono font-bold ${won ? 'text-yellow-400' : 'text-slate-300'}`}>{formatCurrency(value)}</span>
                  )}
                </div>

                {cards ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(cards as CardSummary[]).map((card, i) => (
                      <div key={i}>
                        <CardDisplay card={card as any} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                    {isMe && battle.status === 'READY' && !hasOpened ? (
                      <p className="text-sm font-mono">Ready to open</p>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-mono animate-pulse">
                        <Loader2 size={14} className="animate-spin" /> Waiting…
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Open button */}
      {battle.status === 'READY' && isParticipant && !hasOpened && (
        <button
          onClick={handleOpen}
          disabled={opening}
          className="w-full py-5 rounded-2xl btn-gold font-display text-2xl tracking-widest flex items-center justify-center gap-3 shadow-gold-glow animate-glow-pulse"
        >
          {opening
            ? <><Loader2 size={24} className="animate-spin" /> OPENING…</>
            : <><Zap size={24} className="fill-black" /> OPEN YOUR CASE</>
          }
        </button>
      )}

      {/* Waiting for opponent to open */}
      {battle.status === 'READY' && isParticipant && hasOpened && (
        <div className="glass rounded-2xl border border-white/5 p-6 text-center">
          <Loader2 size={24} className="animate-spin text-yellow-400 mx-auto mb-3" />
          <p className="font-display text-xl text-white tracking-wide">WAITING FOR {opponent?.name?.toUpperCase() ?? 'OPPONENT'}…</p>
        </div>
      )}

      {/* Complete state banner */}
      {battle.status === 'COMPLETE' && isParticipant && (
        <div className={`rounded-2xl border p-6 text-center mt-4 ${iWon ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-white/10 bg-white/2'}`}>
          {iWon ? (
            <>
              <Trophy size={40} className="text-yellow-400 mx-auto mb-3" />
              <p className="font-display text-3xl text-yellow-400 tracking-wide mb-1">YOU WIN!</p>
              {battle.wager > 0 && <p className="text-slate-300 text-sm">🪙 {(battle.wager * 2).toLocaleString()} tokens added to your balance</p>}
            </>
          ) : (
            <>
              <p className="font-display text-3xl text-slate-400 tracking-wide mb-1">YOU LOSE</p>
              <p className="text-slate-500 text-sm">Better luck next time</p>
            </>
          )}
          <Link href="/battles" className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-mono transition-all">
            <RotateCcw size={14} /> New Battle
          </Link>
        </div>
      )}

      {/* Cancelled/expired */}
      {(battle.status === 'CANCELLED' || battle.status === 'EXPIRED') && (
        <div className="glass rounded-2xl border border-white/5 p-8 text-center">
          <p className="font-display text-2xl text-slate-500 tracking-wide mb-1">{battle.status === 'CANCELLED' ? 'BATTLE CANCELLED' : 'BATTLE EXPIRED'}</p>
          <p className="text-slate-600 text-sm mb-5">{battle.status === 'CANCELLED' ? 'Tokens have been refunded.' : 'No opponent joined in time — tokens refunded.'}</p>
          <Link href="/battles" className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-display tracking-wider">
            <Swords size={14} /> Back to Battles
          </Link>
        </div>
      )}
    </div>
  )
}
