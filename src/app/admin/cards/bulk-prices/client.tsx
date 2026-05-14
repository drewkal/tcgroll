'use client'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Download, Upload, Check, X, AlertTriangle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface CardRow {
  id: string
  name: string
  game: string
  rarity: string
  setName: string
  oldValue: number
  newValue: number
}

const RARITY_COLORS: Record<string, string> = {
  LEGENDARY: '#f59e0b', EPIC: '#a855f7', RARE: '#3b82f6', UNCOMMON: '#22c55e', COMMON: '#9ca3af',
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').map(l => l.replace(/\r$/, ''))
  if (lines.length < 2) return []
  const headers = splitCSVRow(lines[0])
  return lines.slice(1).map(line => {
    const vals = splitCSVRow(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]))
  })
}

function splitCSVRow(row: string): string[] {
  const result: string[] = []
  let cur = '', inQuote = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

export function BulkPricesClient({ currentCards }: { currentCards: { id: string; name: string; game: string; rarity: string; value: number }[] }) {
  const [changes, setChanges] = useState<CardRow[]>([])
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentMap = Object.fromEntries(currentCards.map(c => [c.id, c]))

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target?.result as string)
        const diffs: CardRow[] = []
        const errors: string[] = []

        for (const row of rows) {
          const id = row['id']
          const rawValue = row['value']
          if (!id || !rawValue) continue

          const newValue = parseFloat(rawValue)
          if (isNaN(newValue) || newValue < 0) {
            errors.push(`Invalid value for "${row['name'] || id}": ${rawValue}`)
            continue
          }

          const current = currentMap[id]
          if (!current) { errors.push(`Card ID not found: ${id}`); continue }
          if (Math.abs(newValue - current.value) < 0.01) continue

          diffs.push({
            id,
            name: row['name'] || current.name,
            game: row['game'] || current.game,
            rarity: row['rarity'] || current.rarity,
            setName: row['set_name'] ?? '',
            oldValue: current.value,
            newValue,
          })
        }

        if (errors.length > 0) toast.error(`${errors.length} row(s) skipped — check IDs and values`)
        if (diffs.length === 0) toast('No price changes detected')
        setChanges(diffs)
        setDone(false)
      } catch {
        toast.error('Failed to parse CSV')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function applyChanges() {
    setApplying(true)
    try {
      const res = await fetch('/api/admin/cards/bulk-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: changes.map(c => ({ id: c.id, value: c.newValue })) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to update'); return }
      toast.success(`Updated ${data.updated} card prices`)
      setDone(true)
      setChanges([])
    } finally {
      setApplying(false)
    }
  }

  const totalIncrease = changes.filter(c => c.newValue > c.oldValue).length
  const totalDecrease = changes.filter(c => c.newValue < c.oldValue).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/cards" className="text-slate-400 hover:text-yellow-400 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-display text-4xl text-white tracking-wide">BULK PRICE UPDATE</h1>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Step 1: Download */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 font-mono text-sm font-bold">1</div>
            <h2 className="font-display text-lg text-white tracking-wide">DOWNLOAD TEMPLATE</h2>
          </div>
          <p className="text-sm text-slate-400">Export all current card prices as a CSV. Edit the <code className="text-yellow-400 text-xs bg-yellow-400/10 px-1 rounded">value</code> column in Excel or Google Sheets, then upload it back.</p>
          <a
            href="/api/admin/cards/bulk-prices"
            download
            className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display tracking-wider"
          >
            <Download size={15} />
            Download CSV
          </a>
        </div>

        {/* Step 2: Upload */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 font-mono text-sm font-bold">2</div>
            <h2 className="font-display text-lg text-white tracking-wide">UPLOAD UPDATED CSV</h2>
          </div>
          <p className="text-sm text-slate-400">Upload your edited CSV. Only rows with changed values will be updated — unchanged cards are ignored.</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all text-sm font-display tracking-wider"
          >
            <Upload size={15} />
            Choose CSV File
          </button>
        </div>
      </div>

      {/* Step 3: Preview */}
      {changes.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 font-mono text-sm font-bold">3</div>
              <h2 className="font-display text-lg text-white tracking-wide">PREVIEW CHANGES</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-green-400">↑ {totalIncrease} increase</span>
              <span className="text-red-400">↓ {totalDecrease} decrease</span>
              <span className="text-slate-400">{changes.length} total</span>
            </div>
          </div>

          {changes.length > 50 && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-2.5">
              <AlertTriangle size={15} />
              Showing {changes.length} changes — review before applying
            </div>
          )}

          <div className="overflow-auto max-h-[420px] rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0f1629] border-b border-white/5">
                <tr>
                  {['Card', 'Game', 'Rarity', 'Old Price', 'New Price', 'Change'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-mono text-slate-400 tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {changes.map(c => {
                  const diff = c.newValue - c.oldValue
                  const pct = ((diff / c.oldValue) * 100).toFixed(1)
                  const isUp = diff > 0
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-white font-medium">{c.name}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{c.game}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono" style={{ color: RARITY_COLORS[c.rarity] ?? '#9ca3af' }}>{c.rarity}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">🪙 {c.oldValue.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-white">🪙 {c.newValue.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono">
                        <span className={isUp ? 'text-green-400' : 'text-red-400'}>
                          {isUp ? '+' : ''}{diff.toLocaleString()} ({isUp ? '+' : ''}{pct}%)
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={applyChanges}
              disabled={applying}
              className="btn-gold flex items-center gap-2 px-6 py-3 rounded-xl font-display tracking-wider text-sm"
            >
              {applying
                ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                : <Check size={16} />}
              Apply {changes.length} Changes
            </button>
            <button
              onClick={() => setChanges([])}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400">
          <Check size={18} />
          <span className="text-sm font-medium">Prices updated successfully. <Link href="/admin/cards" className="underline underline-offset-2 hover:text-green-300">Back to cards</Link></span>
        </div>
      )}
    </div>
  )
}
