// src/app/open/[slug]/page.tsx
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CaseOpeningClient } from './client'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = await prisma.cardCase.findFirst({ where: { slug, active: true }, select: { name: true, description: true, game: true, price: true } })
  if (!c) return {}
  const gameLabel = c.game.charAt(0) + c.game.slice(1).toLowerCase().replace('_', ' ')
  const title = `Open ${c.name} | TCGRoll`
  const description = c.description ?? `Open the ${c.name} virtual ${gameLabel} case on TCGRoll. Pull rare cards with published drop rates.`
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

async function getCase(slug: string) {
  return prisma.cardCase.findFirst({
    where: { slug, active: true },
    include: {
      caseCards: {
        include: { card: true },
        orderBy: { card: { value: 'desc' } },
      },
      _count: { select: { openings: true } },
    },
  })
}

async function getRecentPulls(caseId: string) {
  return prisma.openingCard.findMany({
    where: { opening: { caseId } },
    include: {
      card: { select: { name: true, rarity: true, value: true, imageUrl: true } },
      opening: {
        select: {
          createdAt: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { opening: { createdAt: 'desc' } },
    take: 20,
  })
}

export default async function OpenCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cardCase = await getCase(slug)
  if (!cardCase) notFound()

  const recentPulls = await getRecentPulls(cardCase.id)

  return <CaseOpeningClient cardCase={cardCase as any} recentPulls={recentPulls as any} />
}
