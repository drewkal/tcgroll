// src/components/layout/navbar.tsx
'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Package, LayoutGrid, ArrowLeftRight, User, LogOut, Shield, Menu, X, Library, Swords, HelpCircle } from 'lucide-react'
import { Logo } from '@/components/logo'
import Image from 'next/image'

export function Navbar({ logoUrl }: { logoUrl?: string | null }) {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/cases', label: 'Cases', icon: Package },
    { href: '/battles', label: 'Battles', icon: Swords },
    { href: '/cards', label: 'Cards', icon: Library },
    { href: '/exchange', label: 'Exchange', icon: ArrowLeftRight },
    { href: '/collection', label: 'Collection', icon: LayoutGrid },
    { href: '/how-it-works', label: 'How It Works', icon: HelpCircle },
  ]

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="hover:opacity-90 transition-opacity">
            {logoUrl
              ? <Image src={logoUrl} alt="TCGRoll" width={320} height={80} className="object-contain h-16 w-auto" unoptimized />
              : <Logo size="lg" />}
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
                {/* Balance + buy tokens */}
                <div className="flex items-center gap-1">
                  <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
                    <span className="font-mono text-sm text-yellow-400 font-medium">
                      {formatCurrency(session.user.balance ?? 0)}
                    </span>
                  </Link>
                  <Link href="/deposit" className="flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-400/10 border border-yellow-400/20 hover:bg-yellow-400/20 hover:border-yellow-400/40 transition-colors text-yellow-400 font-bold text-sm">
                    +
                  </Link>
                </div>

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
                  Sign Up
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
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-gold block text-center px-4 py-3 rounded-lg">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
