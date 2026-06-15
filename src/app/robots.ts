import { MetadataRoute } from 'next'

const BASE = process.env.NEXTAUTH_URL ?? 'https://tcgroll.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/collection', '/profile', '/withdraw', '/deposit', '/exchange'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
