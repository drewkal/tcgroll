'use client'
import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Upload, Trash2, ImageIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Slot = 'logo_header' | 'logo_footer'

const SLOTS: { key: Slot; label: string; desc: string; bg: string }[] = [
  { key: 'logo_header', label: 'Header Logo',  desc: 'Shown in the top navigation bar',    bg: 'bg-navy-900' },
  { key: 'logo_footer', label: 'Footer Logo',  desc: 'Shown at the bottom of every page',  bg: 'bg-navy-950' },
]

function UploadZone({ slot, currentUrl, onUploaded, onCleared }: {
  slot: Slot
  currentUrl: string | null
  onUploaded: (url: string) => void
  onCleared: () => void
}) {
  const [dragging,   setDragging]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [clearing,   setClearing]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('slot', slot)
      form.append('file', file)
      const res  = await fetch('/api/admin/branding', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return }
      onUploaded(data.url)
      toast.success('Logo updated!')
    } finally { setUploading(false) }
  }

  async function clear() {
    setClearing(true)
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      })
      if (!res.ok) { toast.error('Failed to clear'); return }
      onCleared()
      toast.success('Logo cleared — fallback logo will be used')
    } finally { setClearing(false) }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [])

  const slotInfo = SLOTS.find(s => s.key === slot)!

  return (
    <div className="glass rounded-2xl border border-white/5 p-6 space-y-5">
      <div>
        <h2 className="font-display text-2xl tracking-wide text-white">{slotInfo.label.toUpperCase()}</h2>
        <p className="text-slate-400 text-sm mt-1">{slotInfo.desc}</p>
      </div>

      {/* Current preview */}
      <div className={cn('rounded-xl border border-white/10 flex items-center justify-center h-24 overflow-hidden', slotInfo.bg)}>
        {currentUrl ? (
          <Image src={currentUrl} alt={slotInfo.label} width={240} height={80} className="object-contain max-h-20" unoptimized />
        ) : (
          <div className="flex items-center gap-2 text-slate-600">
            <ImageIcon size={20} />
            <span className="text-sm font-mono">Using default logo</span>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all',
          dragging ? 'border-yellow-400/60 bg-yellow-400/5' : 'border-white/10 hover:border-white/20 hover:bg-white/3',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className={dragging ? 'text-yellow-400' : 'text-slate-500'} />
            <p className="text-sm text-slate-400">
              <span className="text-yellow-400 font-medium">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-slate-600">PNG, JPG, SVG, WebP — transparent PNG recommended</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-gold flex-1 py-2.5 rounded-xl font-display tracking-wider text-sm flex items-center justify-center gap-2"
        >
          <Upload size={15} /> Upload New
        </button>
        {currentUrl && (
          <button
            onClick={clear}
            disabled={clearing}
            className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2"
          >
            {clearing
              ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={15} />}
            Reset
          </button>
        )}
      </div>

      {currentUrl && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <Check size={12} /> Custom logo active
        </p>
      )}
    </div>
  )
}

export function BrandingClient({ initial }: { initial: Record<string, string | null> }) {
  const [urls, setUrls] = useState<Record<string, string | null>>(initial)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-colors mb-8 text-sm font-mono">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <p className="text-yellow-400 font-mono text-sm tracking-widest mb-2">— ADMIN</p>
        <h1 className="font-display text-5xl tracking-wide text-white">BRANDING</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Upload custom logos for the header and footer. Use a transparent PNG for best results.
          If no custom logo is set, the default code logo is shown.
        </p>
      </div>

      <div className="space-y-6">
        {SLOTS.map(slot => (
          <UploadZone
            key={slot.key}
            slot={slot.key}
            currentUrl={urls[slot.key] || null}
            onUploaded={url => setUrls(prev => ({ ...prev, [slot.key]: url }))}
            onCleared={() => setUrls(prev => ({ ...prev, [slot.key]: null }))}
          />
        ))}
      </div>

      <div className="mt-8 p-4 glass rounded-xl border border-white/5 text-xs font-mono text-slate-500 space-y-1">
        <p className="text-slate-400 font-medium">Tips</p>
        <p>• Transparent PNG gives the cleanest result on dark backgrounds</p>
        <p>• Recommended header size: ~200 × 50 px</p>
        <p>• Changes are live immediately after upload — no redeploy needed</p>
      </div>
    </div>
  )
}
