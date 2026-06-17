'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Gift, Copy, CheckCheck, Zap, Users, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReferralStats = {
  referralCode: string | null
  referrals: { id: string; name: string | null; createdAt: string; emailVerified: string | null; referralBonusPaid: boolean }[]
  verifiedCount: number
  tokensEarned: number
}

const HOW_STEPS = [
  { icon: Gift, color: '#fbbf24', title: 'Share your link', desc: 'Copy your unique referral link from below and share it with friends.' },
  { icon: Users, color: '#a78bfa', title: 'They sign up', desc: 'Your friend creates an account using your link and verifies their email.' },
  { icon: Coins, color: '#34d399', title: 'You both benefit', desc: 'You earn 🪙 500 tokens instantly. They get 🪙 500 tokens as their welcome bonus.' },
]

function ReferralsInner() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch('/api/user/referrals')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [session])

  const referralUrl = stats?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://tcgroll.com'}/register?ref=${stats.referralCode}`
    : null

  const copy = () => {
    if (!referralUrl) return
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">

      {/* Hero */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-5">
          <Gift size={30} className="text-yellow-400" />
        </div>
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-3">— REFERRAL PROGRAM</p>
        <h1 className="font-display text-5xl md:text-6xl tracking-wide text-white mb-4">REFER A FRIEND</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Share TCGRoll with friends and earn <span className="text-yellow-400 font-semibold">🪙 500 tokens</span> every time someone signs up and verifies their email. No limit on referrals.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {HOW_STEPS.map(({ icon: Icon, color, title, desc }, i) => (
          <div key={title} className="glass rounded-2xl border border-white/5 p-6 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: color + '18', border: `1px solid ${color}30` }}
            >
              <Icon size={22} style={{ color }} />
            </div>
            <div className="font-mono text-xs text-slate-500 mb-1">STEP {i + 1}</div>
            <h3 className="font-display text-lg text-white tracking-wide mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Referral link / CTA */}
      {status === 'loading' ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !session ? (
        <div className="glass rounded-2xl border border-yellow-400/20 p-8 text-center">
          <h2 className="font-display text-3xl text-white tracking-wide mb-3">Ready to start earning?</h2>
          <p className="text-slate-400 mb-6">Create a free account to get your personal referral link.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-gold px-8 py-3.5 rounded-xl font-display tracking-widest text-lg flex items-center gap-2">
              <Zap size={18} className="fill-black" /> Sign Up Free
            </Link>
            <Link href="/login" className="px-8 py-3.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all font-display tracking-wider">
              Log In
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-yellow-400/20 p-8 space-y-6">
          <h2 className="font-display text-2xl text-white tracking-wide">Your Referral Link</h2>

          {referralUrl ? (
            <div className="flex gap-2">
              <div className="flex-1 bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm font-mono truncate select-all">
                {referralUrl}
              </div>
              <button
                onClick={copy}
                className="btn-gold px-5 py-3 rounded-xl text-sm flex items-center gap-2 flex-shrink-0"
              >
                {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Generating your referral code — try refreshing the page.</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-white/5 p-5 text-center">
              <div className="font-display text-4xl text-white mb-1">{stats?.verifiedCount ?? 0}</div>
              <div className="text-xs font-mono text-slate-500 tracking-wider">FRIENDS JOINED</div>
            </div>
            <div className="rounded-xl border border-yellow-400/10 p-5 text-center">
              <div className="font-display text-4xl text-yellow-400 mb-1">{(stats?.tokensEarned ?? 0).toLocaleString()}</div>
              <div className="text-xs font-mono text-slate-500 tracking-wider">TOKENS EARNED</div>
            </div>
          </div>

          {/* Referral list */}
          {stats && stats.referrals.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-1">
              <p className="text-xs font-mono text-slate-500 tracking-wider mb-3">ALL REFERRALS</p>
              {stats.referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl hover:bg-white/3 transition-colors">
                  <span className="text-sm text-white">{r.name ?? 'Unknown'}</span>
                  <span className={cn('text-xs font-mono',
                    !r.emailVerified ? 'text-slate-500' :
                    r.referralBonusPaid ? 'text-green-400' : 'text-orange-400'
                  )}>
                    {!r.emailVerified ? 'pending verification' :
                     r.referralBonusPaid ? '+500 earned' : 'not eligible — same network'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {stats && stats.referrals.length === 0 && (
            <p className="text-center text-slate-500 text-sm pt-2">No referrals yet — share your link to start earning!</p>
          )}
        </div>
      )}

    </div>
  )
}

export default function ReferralsPage() {
  return (
    <Suspense>
      <ReferralsInner />
    </Suspense>
  )
}
