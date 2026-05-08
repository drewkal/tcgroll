// src/app/open/[slug]/page.tsx
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CaseOpeningClient } from './client'

async function getCase(slug: string) {
  return prisma.cardCase.findFirst({
    where: { slug, active: true },
    include: {
      caseCards: {
        include: { card: true },
        orderBy: { dropRate: 'desc' },
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
