'use client'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export function EmailBlastButton() {
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!confirm('Send the referral email to all verified users? This cannot be undone.')) return
    setLoading(true)
    const id = toast.loading('Sending emails…')
    try {
      const res = await fetch('/api/admin/email-blast', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to send', { id })
      } else {
        toast.success(`Sent ${data.sent} of ${data.total} emails${data.failed ? ` (${data.failed} failed)` : ''}`, { id })
      }
    } catch {
      toast.error('Unexpected error', { id })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={send}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20 text-sm font-display tracking-wider transition-colors disabled:opacity-50"
    >
      <Mail size={14} />
      {loading ? 'Sending…' : 'Email Blast'}
    </button>
  )
}
