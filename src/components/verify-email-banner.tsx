'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { MailCheck, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function VerifyEmailBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  if (!session || session.user.emailVerified || dismissed) return null

  const resend = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      if (res.ok) toast.success('Verification email sent!')
      else toast.error('Failed to send — try again shortly')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="w-full bg-yellow-400/10 border-b border-yellow-400/20 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-sm min-w-0">
        <MailCheck size={15} className="text-yellow-400 flex-shrink-0" />
        <span className="text-slate-300 truncate">
          Verify your email to claim{' '}
          <span className="text-yellow-400 font-semibold">🪙 750 free tokens</span>
        </span>
        <button
          onClick={resend}
          disabled={sending}
          className="flex-shrink-0 text-xs font-mono text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {sending && <Loader2 size={11} className="animate-spin" />}
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      </div>
      <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
