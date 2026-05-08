// src/components/image-upload.tsx
'use client'
import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = 'IMAGE' }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return }
      onChange(data.url)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">{label}</label>
      <div className="space-y-2">
        {/* Preview */}
        {value && (
          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-navy-800 border border-white/10 group">
            <img src={value} alt="Preview" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Upload button + URL fallback */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-navy-800 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-mono transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {uploading
              ? <div className="w-3.5 h-3.5 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
              : <Upload size={13} />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="or paste URL..."
            className="flex-1 bg-navy-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-yellow-400/50"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
      </div>
    </div>
  )
}
