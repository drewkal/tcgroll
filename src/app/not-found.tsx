// src/app/not-found.tsx
import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6 animate-float">🎴</div>
      <h1 className="font-display text-8xl text-white tracking-wide mb-4">404</h1>
      <p className="text-slate-400 text-lg mb-8">This card doesn't exist in our collection.</p>
      <Link href="/" className="btn-gold px-8 py-4 rounded-xl font-display tracking-widest flex items-center gap-2">
        <Zap size={18} className="fill-black" />
        Back to Home
      </Link>
    </div>
  )
}
