'use client'
import { useState } from 'react'
import { Edit, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

export function EditBalanceButton({ userId, name, currentBalance }: { userId: string; name: string | null; currentBalance: number }) {
  const [open, setOpen]       = useState(false)
  const [value, setValue]     = useState(String(Math.round(currentBalance)))
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    const balance = Number(value)
    if (isNaN(balance) || balance < 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      const res  = await fetch(`/api/admin/users/${userId}/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Balance updated to ${formatCurrency(data.balance)}`)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setValue(String(Math.round(currentBalance))); setOpen(true) }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 text-xs transition-colors ml-2"
      >
        <Edit size={11} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm glass rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-white tracking-wide">EDIT BALANCE</h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">{name ?? 'User'} — current: <span className="text-yellow-400 font-mono">{formatCurrency(currentBalance)}</span></p>
            <div className="mb-4">
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">NEW BALANCE 🪙</label>
              <input
                type="number" min="0" value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save() }}
                className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400/50 transition-colors font-mono"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-all">
                Cancel
              </button>
              <button
                onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl btn-gold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
