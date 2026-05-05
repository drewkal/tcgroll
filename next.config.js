/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pokemontcg.io' },
      { protocol: 'https', hostname: 'assets.pokemon.com' },
      { protocol: 'https', hostname: '*.vercel-storage.com' },
    ],
  },
}

module.exports = nextConfig