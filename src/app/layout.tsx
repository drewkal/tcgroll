// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/footer'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'
import { getSettings } from '@/lib/settings'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const logos = await getSettings(['logo_header', 'logo_footer'])

  return (
    <html lang="en" className="noise">
      <body className="mesh-bg min-h-screen">
        <Providers>
          <Navbar logoUrl={logos.logo_header || null} />
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
        <SiteFooter logoUrl={logos.logo_footer || null} />
        <Analytics />
      </body>
    </html>
  )
}
