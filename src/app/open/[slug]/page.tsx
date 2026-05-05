// src/app/open/[slug]/page.tsx
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

export default async function OpenCasePage({ params }: { params: { slug: string } }) {
  const cardCase = await getCase(params.slug)
  if (!cardCase) notFound()

  return <CaseOpeningClient cardCase={cardCase as any} />
}
