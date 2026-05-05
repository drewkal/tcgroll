// src/app/register/page.tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Registration failed')
        return
      }
      toast.success(data.message ?? 'Account created!')
      // Auto sign in
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      router.push('/cases')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-gold-glow mx-auto mb-4">
            <Zap size={28} className="text-black fill-black" />
          </div>
          <h1 className="font-display text-4xl tracking-wide text-white">JOIN TCGROLL</h1>
          <p className="text-slate-400 text-sm mt-2">Create your account and receive <span className="text-yellow-400 font-semibold">$5 free</span> to start opening</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/5 p-8 space-y-5">
          {[
            { key: 'name', label: 'TRAINER NAME', type: 'text', icon: User, placeholder: 'Ash Ketchum' },
            { key: 'email', label: 'EMAIL', type: 'email', icon: Mail, placeholder: 'trainer@example.com' },
          ].map(({ key, label, type, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">{label}</label>
              <div className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={set(key as keyof typeof form)}
                  required
                  placeholder={placeholder}
                  className="w-full bg-navy-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm"
                />
              </div>
            </div>
          ))}

          {['password', 'confirm'].map((key, i) => (
            <div key={key}>
              <label className="block text-xs font-mono text-slate-400 tracking-wider mb-2">
                {i === 0 ? 'PASSWORD' : 'CONFIRM PASSWORD'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form[key as keyof typeof form]}
                  onChange={set(key as keyof typeof form)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-navy-800 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors text-sm"
                />
                {i === 0 && (
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3.5 rounded-xl font-display tracking-widest text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : <><Zap size={18} className="fill-black" /> CREATE ACCOUNT</>}
          </button>

          <p className="text-center text-sm text-slate-400">
            Already a trainer?{' '}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
