import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = process.env.NEXTAUTH_URL ?? 'https://tcgroll.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cases, cards] = await Promise.all([
    prisma.cardCase.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.card.findMany({ select: { id: true, updatedAt: true } }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,          lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/cases`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/cases/pokemon`,     lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/cases/one-piece`,   lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/cases/magic`,       lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/cases/dragon-ball`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/cards`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/fair`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/terms`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const casePages: MetadataRoute.Sitemap = cases.map(c => ({
    url: `${BASE}/open/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const cardPages: MetadataRoute.Sitemap = cards.map(c => ({
    url: `${BASE}/cards/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...casePages, ...cardPages]
}
