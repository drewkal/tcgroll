// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/navbar'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: {
    default: 'TCGRoll — Open Virtual TCG Cases Online',
    template: '%s | TCGRoll',
  },
  description: 'Open virtual Pokémon, One Piece, Magic, and Dragon Ball card cases with real rarity odds. Pull legendary holos, build your collection, and sell duplicates.',
  keywords: ['pokemon case opening', 'virtual tcg', 'open pokemon packs online', 'one piece card opening', 'magic the gathering case', 'dragon ball card opening', 'tcg case simulator'],
  openGraph: {
    title: 'TCGRoll — Open Virtual TCG Cases Online',
    description: 'Open virtual TCG cases with real rarity odds. Pokémon, One Piece, Magic, and Dragon Ball.',
    type: 'website',
    siteName: 'TCGRoll',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TCGRoll — Open Virtual TCG Cases Online',
    description: 'Open virtual TCG cases with real rarity odds. Pull legendary holos and build your collection.',
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
        <footer className="border-t border-white/5 py-8 mt-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
            <span className="font-logo text-xl text-yellow-400">TCG<span className="text-white">ROLL</span></span>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="/about"   className="hover:text-yellow-400 transition-colors">About</a>
              <a href="/terms"   className="hover:text-yellow-400 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-yellow-400 transition-colors">Privacy</a>
              <a href="/faq"     className="hover:text-yellow-400 transition-colors">FAQ</a>
              <a href="/fair"    className="hover:text-yellow-400 transition-colors">Provably Fair</a>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
