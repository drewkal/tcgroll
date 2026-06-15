// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/footer'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'
import { getSettings } from '@/lib/settings'
import Script from 'next/script'
import { VerifyEmailBanner } from '@/components/verify-email-banner'
import { CookieBanner } from '@/components/cookie-banner'

export const metadata: Metadata = {
  metadataBase: new URL('https://tcgroll.com'),
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
      <head>
        {/* Consent defaults must be set before GA/GTM load */}
        <Script id="consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          try {
            var c = localStorage.getItem('cookie_consent');
            if (c === 'granted') {
              gtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
              });
            }
          } catch(e) {}
        `}</Script>
        <Script id="gtm-head" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WLWNW75J');
        `}</Script>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-9922Z4W1VB" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-9922Z4W1VB');
          gtag('config', 'AW-737826355');
        `}</Script>
        <Script async src="https://analytics.ahrefs.com/analytics.js" data-key="Wn2Ym89Ku+/S5gfuYlOg5w" strategy="afterInteractive" />
      </head>
      <body className="mesh-bg min-h-screen">
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WLWNW75J"
            height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
        </noscript>
        <Providers>
          <Navbar logoUrl={logos.logo_header || null} />
          <VerifyEmailBanner />
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
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  )
}
