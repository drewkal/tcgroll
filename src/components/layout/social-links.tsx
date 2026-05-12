'use client'
import { SocialIcon, getPlatformColor, getPlatformLabel } from '@/components/social-icons'

type Link = { id: string; platform: string; url: string }

export function SocialLinks({ links }: { links: Link[] }) {
  if (links.length === 0) return null
  return (
    <div className="flex items-center gap-3">
      {links.map(link => {
        const color = getPlatformColor(link.platform)
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={getPlatformLabel(link.platform)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 bg-white/5 transition-all hover:scale-110"
            style={{ '--hover-color': color } as React.CSSProperties}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = color
              el.style.backgroundColor = color + '20'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.color = ''
              el.style.backgroundColor = ''
            }}
          >
            <SocialIcon platform={link.platform} size={16} />
          </a>
        )
      })}
    </div>
  )
}
