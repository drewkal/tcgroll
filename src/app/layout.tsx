// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/navbar'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'TCGRoll — Pokémon Card Case Opening',
  description: 'Open virtual Pokémon card cases, collect rare cards, and build your ultimate collection.',
  keywords: ['pokemon', 'tcg', 'card opening', 'case opening', 'collectibles'],
  openGraph: {
    title: 'TCGRoll — Pokémon Card Case Opening',
    description: 'Open virtual Pokémon card cases and collect rare cards.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="noise">
      <body className="mesh-bg min-h-screen">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#151d38',
                color: '#e2e8f0',
                border: '1px solid rgba(251,191,36,0.2)',
                fontFamily: 'var(--font-body)',
              },
              success: { iconTheme: { primary: '#fbbf24', secondary: '#000' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
      <footer className="border-t border-white/5 py-8 mt-20">
  <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
    <span className="font-display text-xl text-yellow-400 tracking-wider">TCGROLL</span>
    <div className="flex gap-6 text-sm text-slate-500">
      <a href="/about"   className="hover:text-yellow-400 transition-colors">About</a>
      <a href="/terms"   className="hover:text-yellow-400 transition-colors">Terms</a>
      <a href="/privacy" className="hover:text-yellow-400 transition-colors">Privacy</a>
      <a href="/faq"     className="hover:text-yellow-400 transition-colors">FAQ</a>
    </div>
  </div>
</footer>
    </html>
  )
}
