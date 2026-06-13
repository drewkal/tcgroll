'use client'
import { useState } from 'react'
import { Swords, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function SeedBotsButton() {
  const [loading, setLoading] = useState(false)

  const seed = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/seed-bots', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Created ${data.created} bot battle${data.created !== 1 ? 's' : ''}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={seed}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-700 border border-white/10 text-slate-300 hover:text-white text-sm font-display tracking-wider transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
      Seed Bots
    </button>
  )
}
