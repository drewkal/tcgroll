// src/components/layout/footer.tsx
import { prisma } from '@/lib/prisma'
import { SocialLinks } from './social-links'

export async function SiteFooter() {
  const socialLinks = await prisma.socialLink.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { id: true, platform: true, url: true },
  })

  return (
    <footer className="border-t border-white/5 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-6">
        <span className="font-logo text-xl text-yellow-400">TCG<span className="text-white">ROLL</span></span>

        <div className="flex gap-6 text-sm text-slate-500">
          <a href="/about"   className="hover:text-yellow-400 transition-colors">About</a>
          <a href="/terms"   className="hover:text-yellow-400 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-yellow-400 transition-colors">Privacy</a>
          <a href="/faq"     className="hover:text-yellow-400 transition-colors">FAQ</a>
          <a href="/fair"    className="hover:text-yellow-400 transition-colors">Provably Fair</a>
        </div>

        <SocialLinks links={socialLinks} />
      </div>
    </footer>
  )
}
