// src/app/admin/cases/new/page.tsx
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminCaseEditor } from '../[id]/editor'
import { prisma } from '@/lib/prisma'

export default async function NewCasePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const allCards = await prisma.card.findMany({
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  })

  return <AdminCaseEditor allCards={allCards} isNew={true} />
}
