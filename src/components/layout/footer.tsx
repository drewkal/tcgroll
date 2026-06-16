// src/components/layout/footer.tsx
import { prisma } from '@/lib/prisma'
import { SocialLinks } from './social-links'
import { Logo } from '@/components/logo'
import Image from 'next/image'

export async function SiteFooter({ logoUrl }: { logoUrl?: string | null }) {
  const socialLinks = await prisma.socialLink.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { id: true, platform: true, url: true },
  })

  return (
    <footer className="border-t border-white/5 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-6">
        {logoUrl
          ? <Image src={logoUrl} alt="TCGRoll" width={200} height={52} className="object-contain h-11 w-auto" unoptimized />
          : <Logo size="sm" />}

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
          <a href="/about"        className="hover:text-yellow-400 transition-colors">About</a>
          <a href="/how-it-works" className="hover:text-yellow-400 transition-colors">How It Works</a>
          <a href="/card-quality" className="hover:text-yellow-400 transition-colors">Card Quality</a>
          <a href="/faq"          className="hover:text-yellow-400 transition-colors">FAQ</a>
          <a href="/fair"         className="hover:text-yellow-400 transition-colors">Provably Fair</a>
          <a href="/terms"        className="hover:text-yellow-400 transition-colors">Terms</a>
          <a href="/privacy"      className="hover:text-yellow-400 transition-colors">Privacy</a>
        </div>

        <SocialLinks links={socialLinks} />
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} TCGRoll. All rights reserved. TCGRoll is not affiliated with, endorsed by, or sponsored by Pokémon, Nintendo, Konami, Wizards of the Coast, Bandai, or any other card publisher.
      </div>
    </footer>
  )
}
