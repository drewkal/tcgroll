'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

declare global {
  function gtag(...args: unknown[]): void
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent')
    if (!stored) setVisible(true)
  }, [])

  const respond = (granted: boolean) => {
    const val = granted ? 'granted' : 'denied'
    localStorage.setItem('cookie_consent', val)
    setVisible(false)

    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage:    val,
        ad_storage:           val,
        ad_user_data:         val,
        ad_personalization:   val,
      })
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      style={{ animation: 'slide-up 0.3s ease-out' }}
    >
      <div className="max-w-4xl mx-auto glass rounded-2xl border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xl">
        <Cookie size={20} className="text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />

        <p className="text-sm text-slate-300 flex-1 leading-relaxed">
          We use cookies and analytics (Google Analytics, Google Ads) to understand how you use TCGRoll and improve the experience.{' '}
          <Link href="/privacy" className="text-yellow-400 hover:underline underline-offset-2">Privacy Policy</Link>
        </p>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={() => respond(false)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm font-mono transition-all"
          >
            Decline
          </button>
          <button
            onClick={() => respond(true)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl btn-gold text-sm font-mono"
          >
            Accept
          </button>
          <button
            onClick={() => respond(false)}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors sm:hidden"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
