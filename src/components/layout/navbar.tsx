// src/components/layout/navbar.tsx
'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Package, LayoutGrid, BookOpen, User, LogOut, Shield, Menu, X } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/cases', label: 'Cases', icon: Package },
    { href: '/collection', label: 'Collection', icon: LayoutGrid },
  ]

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:scale-110">
              <rect width="34" height="34" rx="8" fill="#0f1629"/>
              <rect width="34" height="34" rx="8" fill="url(#diceGrad)" fillOpacity="0.15"/>
              <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" stroke="url(#diceGrad)" strokeOpacity="0.4"/>
              {/* top-left: common gray */}
              <circle cx="10" cy="10" r="3" fill="#9ca3af"/>
              {/* top-right: uncommon green */}
              <circle cx="24" cy="10" r="3" fill="#22c55e"/>
              {/* center: rare blue */}
              <circle cx="17" cy="17" r="3" fill="#3b82f6"/>
              {/* bottom-left: epic purple */}
              <circle cx="10" cy="24" r="3" fill="#a855f7"/>
              {/* bottom-right: legendary gold */}
              <circle cx="24" cy="24" r="3" fill="#f59e0b"/>
              <defs>
                <linearGradient id="diceGrad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f59e0b"/>
                  <stop offset="50%" stopColor="#a855f7"/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="font-logo text-[1.4rem] leading-none tracking-wide text-yellow-400">
              TCG<span className="text-white">ROLL</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {/* Balance */}
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-gold-glow-sm" />
                  <span className="font-mono text-sm text-yellow-400 font-medium">
                    {formatCurrency(session.user.balance ?? 0)}
                  </span>
                </Link>

                {/* Admin badge */}
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" className="p-2 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                    <Shield size={16} />
                  </Link>
                )}

                {/* Profile */}
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-300 hover:text-white">
                  <User size={16} />
                  <span className="max-w-24 truncate">{session.user.name}</span>
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="btn-gold px-4 py-2 rounded-lg text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 py-4 px-4 space-y-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          <div className="border-t border-white/5 pt-3 mt-3">
            {session ? (
              <div className="space-y-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="font-mono text-yellow-400">{formatCurrency(session.user.balance ?? 0)}</span>
                </div>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5">
                  <User size={18} /> Profile
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-yellow-400 hover:bg-yellow-400/10">
                    <Shield size={18} /> Admin Panel
                  </Link>
                )}
                <button onClick={() => signOut({ callbackUrl: '/' })} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10">
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-gold block text-center px-4 py-3 rounded-lg">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
