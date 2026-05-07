// src/app/admin/cards/page.tsx
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminCardsClient } from './client'

export default async function AdminCardsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const cards = await prisma.card.findMany({
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  })

  return <AdminCardsClient cards={cards} />
}
