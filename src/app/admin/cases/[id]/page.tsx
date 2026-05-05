// src/app/admin/cases/[id]/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminCaseEditor } from './editor'

export default async function AdminCasePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const isNew = params.id === 'new'

  const [cardCase, allCards] = await Promise.all([
    isNew ? null : prisma.cardCase.findUnique({
      where: { id: params.id },
      include: {
        caseCards: { include: { card: true } },
      },
    }),
    prisma.card.findMany({ orderBy: [{ rarity: 'desc' }, { name: 'asc' }] }),
  ])

  if (!isNew && !cardCase) redirect('/admin')

  return <AdminCaseEditor cardCase={cardCase as any} allCards={allCards} isNew={isNew} />
}
