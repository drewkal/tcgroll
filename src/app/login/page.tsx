// src/app/login/page.tsx
'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/cases'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email, password, redirect: false,
      })
      if (result?.error) {
        toast.error('Invalid email or password')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-gold-glow mx-auto mb-4">
            <Zap size={28} className="text-black fill-black" />
          </div>
          <h1 className="font-display text-4xl tracking-wide text-white">WELCOME BACK</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to your TCGRoll account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/5 p-8 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">EMAIL</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="trainer@example.com"
                className="w-full bg-navy-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">PASSWORD</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-navy-800 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5 rounded-xl font-display tracking-widest text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>SIGN IN <Zap size={18} className="fill-black" /></>
            )}
          </button>

          <p className="text-center text-sm text-slate-400">
            No account?{' '}
            <Link href="/register" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Create one free — get $5
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
