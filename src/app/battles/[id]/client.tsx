'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Swords, Copy, Zap, Loader2, Trophy, Clock, RotateCcw, ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getRarityColor } from '@/lib/opening-engine'
import { CardDisplay } from '@/components/cards/card-display'
import { SpinReel, Celebration, playRevealSound } from '@/components/case-reel'
import { Card } from '@prisma/client'

type CaseCard = { card: Card; dropRate: number }
type CardSummary = { id: string; name: string; rarity: string; value: number; imageUrl: string | null }
type Battle = {
  id: string; status: string; wager: number; winnerId: string | null
  creatorId: string; creator: { id: string; name: string | null }
  creatorValue: number | null; creatorCards: CardSummary[] | null
  joinerId: string | null; joiner: { id: string; name: string | null } | null
  joinerValue: number | null; joinerCards: CardSummary[] | null
  case: { id: string; name: string; price: number; game: string; slug: string; caseCards: CaseCard[] }
  expiresAt: string
}

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Waiting for opponent…',
  READY: 'Both players ready — open your case!',
  COMPLETE: 'Battle complete!',
  CANCELLED: 'Battle cancelled',
  EXPIRED: 'Battle expired',
}

type SpinPhase = 'idle' | 'fetching' | 'spinning' | 'revealing' | 'done'

export function BattleRoomClient({ initialBattle }: { initialBattle: Battle }) {
  const { data: session } = useSession()
  const [battle, setBattle] = useState<Battle>(initialBattle)
  const [cancelling, setCancelling] = useState(false)

  // Spin state
  const [spinPhase, setSpinPhase]         = useState<SpinPhase>('idle')
  const [winningCards, setWinningCards]   = useState<Card[]>([])
  const [spinIndex, setSpinIndex]         = useState(0)
  const [revealingCard, setRevealingCard] = useState<Card | null>(null)
  const [revealExiting, setRevealExiting] = useState(false)

  const isCreator     = session?.user?.id === battle.creatorId
  const isJoiner      = session?.user?.id === battle.joinerId
  const isParticipant = isCreator || isJoiner
  const myCards       = isCreator ? battle.creatorCards : battle.joinerCards
  const oppCards      = isCreator ? battle.joinerCards  : battle.creatorCards
  const opponent      = isCreator ? battle.joiner        : battle.creator
  const iWon          = battle.winnerId === session?.user?.id
  const hasOpened     = !!myCards || spinPhase !== 'idle'
  // Only show cards/results after spin finishes — or immediately if loading an already-complete battle
  const canShowResults = spinPhase === 'done' || (spinPhase === 'idle' && battle.status === 'COMPLETE')

  // Merge incoming battle data but always preserve caseCards from initial state
  const mergeBattle = useCallback((data: Partial<Battle>) => {
    setBattle(prev => ({ ...prev, ...data, case: { ...prev.case, ...data.case, caseCards: prev.case.caseCards } }))
  }, [])

  // Poll for updates while battle is active
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/${battle.id}`)
      if (res.ok) mergeBattle(await res.json())
    } catch {}
  }, [battle.id, mergeBattle])

  useEffect(() => {
    if (battle.status === 'COMPLETE' || battle.status === 'CANCELLED' || battle.status === 'EXPIRED') return
    const interval = setInterval(poll, 2500)
    return () => clearInterval(interval)
  }, [battle.status, poll])

  const handleOpen = async () => {
    if (spinPhase !== 'idle') return
    setSpinPhase('fetching')
    try {
      const res = await fetch(`/api/battles/${battle.id}/open`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); setSpinPhase('idle'); return }
      setWinningCards(data.myCards ?? [])
      setSpinIndex(0)
      setSpinPhase('spinning')
      mergeBattle(data)
    } catch {
      toast.error('Something went wrong'); setSpinPhase('idle')
    }
  }

  const handleSpinComplete = useCallback(() => {
    const card = winningCards[spinIndex]
    if (!card) return
    setRevealingCard(card)
    setRevealExiting(false)
    setSpinPhase('revealing')
    const revealMs = (card.rarity === 'LEGENDARY' || card.rarity === 'EPIC') ? 3000 : 2000
    setTimeout(() => {
      setRevealExiting(true)
      setTimeout(() => {
        setRevealingCard(null)
        setRevealExiting(false)
        const next = spinIndex + 1
        if (next >= winningCards.length) {
          setSpinPhase('done')
        } else {
          setSpinIndex(next)
          setSpinPhase('spinning')
        }
      }, 350)
    }, revealMs)
  }, [spinIndex, winningCards])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`/api/battles/${battle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error((await res.json()).error); return }
      setBattle(b => ({ ...b, status: 'CANCELLED' }))
      toast.success('Battle cancelled — tokens refunded')
    } finally { setCancelling(false) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/battles/${battle.id}`)
    toast.success('Link copied!')
  }

  const isSpinning = spinPhase === 'spinning' || spinPhase === 'revealing' || spinPhase === 'fetching'

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
        <div className="text-center glass rounded-2xl border border-yellow-400/20 px-6 py-3">
          <div className="font-display text-3xl text-yellow-400">
            {battle.creatorValue !== null && battle.joinerValue !== null
              ? formatCurrency((battle.wager * 2) + Math.min(battle.creatorValue ?? 0, battle.joinerValue ?? 0))
              : battle.wager > 0 ? formatCurrency(battle.wager * 2) + '+' : 'Cards'}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-0.5">WINNER GETS</div>
        </div>
      </div>

      {/* WAITING */}
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
            <button onClick={handleCancel} disabled={cancelling} className="text-xs font-mono text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto">
              {cancelling && <Loader2 size={11} className="animate-spin" />} Cancel & refund
            </button>
          )}
        </div>
      )}

      {/* READY / SPINNING / COMPLETE — both player panels */}
      {(battle.status === 'READY' || battle.status === 'COMPLETE') && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: battle.creator.name ?? 'Creator', cards: battle.creatorCards, value: battle.creatorValue, playerId: battle.creatorId, isMe: isCreator },
            { label: battle.joiner?.name ?? 'Challenger', cards: battle.joinerCards, value: battle.joinerValue, playerId: battle.joinerId, isMe: isJoiner },
          ].map(({ label, cards, value, playerId, isMe }) => {
            const won = battle.status === 'COMPLETE' && battle.winnerId === playerId
            const showSpinning = isMe && isSpinning
            return (
              <div key={playerId ?? label} className="glass rounded-2xl border p-4" style={{ borderColor: won ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {won && canShowResults && <Trophy size={14} className="text-yellow-400" />}
                    <span className="font-display text-lg text-white tracking-wide">{label}</span>
                    {isMe && <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">YOU</span>}
                  </div>
                  {canShowResults && value !== null && value !== undefined && (
                    <span className={`font-mono text-sm font-bold ${won ? 'text-yellow-400' : 'text-slate-300'}`}>{formatCurrency(value)}</span>
                  )}
                </div>

                {/* Cards — only shown after spin completes */}
                {isMe && canShowResults && myCards ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {myCards.map((card, i) => <CardDisplay key={i} card={card as any} size="sm" />)}
                  </div>
                ) : !isMe && canShowResults && cards ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {(cards as CardSummary[]).map((card, i) => <CardDisplay key={i} card={card as any} size="sm" />)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-slate-600">
                    {showSpinning ? (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm font-mono animate-pulse">
                        <Zap size={14} className="fill-yellow-400" /> OPENING…
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-600 text-sm font-mono animate-pulse">
                        <Loader2 size={14} className="animate-spin" />
                        {isMe ? 'Ready' : 'Waiting…'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Spin reel — full width below panels */}
      {spinPhase === 'spinning' && winningCards[spinIndex] && (
        <div className="glass rounded-2xl border border-yellow-400/20 p-4 overflow-hidden animate-fade-in mb-5">
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-xs font-mono text-slate-500 tracking-widest">CARD {spinIndex + 1} OF {winningCards.length}</span>
            <div className="flex gap-1.5">
              {winningCards.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < spinIndex ? 'bg-yellow-400' : i === spinIndex ? 'bg-yellow-400 animate-pulse scale-125' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
          <SpinReel
            key={spinIndex}
            caseCards={battle.case.caseCards}
            winner={winningCards[spinIndex]}
            onComplete={handleSpinComplete}
          />
        </div>
      )}

      {/* Card reveal overlay */}
      {spinPhase === 'revealing' && revealingCard && (
        <>
          {(revealingCard.rarity === 'LEGENDARY' || revealingCard.rarity === 'EPIC') && <Celebration rarity={revealingCard.rarity} />}
          <div
            className="glass rounded-2xl border flex flex-col items-center justify-center py-8 gap-4 mb-5"
            style={{
              borderColor: getRarityColor(revealingCard.rarity) + '60',
              background: `radial-gradient(ellipse at center, ${getRarityColor(revealingCard.rarity)}12 0%, transparent 70%)`,
              transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
              opacity: revealExiting ? 0 : 1,
              transform: revealExiting ? 'scale(0.94) translateY(16px)' : 'scale(1) translateY(0)',
            }}
          >
            <CardDisplay card={revealingCard as any} size="xl" />
            <div className="text-center">
              <div className="font-display text-2xl tracking-widest" style={{ color: getRarityColor(revealingCard.rarity), textShadow: `0 0 20px ${getRarityColor(revealingCard.rarity)}` }}>
                {revealingCard.rarity === 'LEGENDARY' ? '🏆 LEGENDARY!' : revealingCard.rarity === 'EPIC' ? '✨ EPIC PULL!' : revealingCard.rarity === 'RARE' ? '⭐ RARE PULL' : revealingCard.name}
              </div>
              <div className="font-mono text-lg text-yellow-400 mt-1">{formatCurrency(revealingCard.value)}</div>
            </div>
          </div>
        </>
      )}

      {/* Open button */}
      {battle.status === 'READY' && isParticipant && !hasOpened && spinPhase === 'idle' && (
        <button
          onClick={handleOpen}
          className="w-full py-5 rounded-2xl btn-gold font-display text-2xl tracking-widest flex items-center justify-center gap-3 shadow-gold-glow animate-glow-pulse mb-5"
        >
          <Zap size={24} className="fill-black" /> OPEN YOUR CASE
        </button>
      )}

      {spinPhase === 'fetching' && (
        <div className="w-full py-5 rounded-2xl glass border border-yellow-400/20 flex items-center justify-center gap-3 text-yellow-400 font-display text-xl tracking-widest mb-5">
          <Loader2 size={22} className="animate-spin" /> ROLLING…
        </div>
      )}

      {/* Waiting for opponent after you've opened */}
      {battle.status === 'READY' && isParticipant && spinPhase === 'done' && !battle.winnerId && (
        <div className="glass rounded-2xl border border-white/5 p-6 text-center mb-5">
          <Loader2 size={24} className="animate-spin text-yellow-400 mx-auto mb-3" />
          <p className="font-display text-xl text-white tracking-wide">WAITING FOR {opponent?.name?.toUpperCase() ?? 'OPPONENT'}…</p>
        </div>
      )}

      {/* Complete */}
      {battle.status === 'COMPLETE' && isParticipant && canShowResults && (
        <div className={`rounded-2xl border p-6 text-center ${iWon ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-white/10 bg-white/2'}`}>
          {iWon ? (
            <>
              <Trophy size={40} className="text-yellow-400 mx-auto mb-3" />
              <p className="font-display text-3xl text-yellow-400 tracking-wide mb-1">YOU WIN!</p>
              {(() => {
                const loserVal = isCreator ? (battle.joinerValue ?? 0) : (battle.creatorValue ?? 0)
                const prize = (battle.wager * 2) + loserVal
                return <p className="text-slate-300 text-sm">{formatCurrency(prize)} added to your balance — wager + opponent's cards</p>
              })()}
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

      {/* Cancelled / Expired */}
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
