export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BulkPricesClient } from './client'

export default async function BulkPricesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const cards = await prisma.card.findMany({
    orderBy: [{ game: 'asc' }, { rarity: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, game: true, rarity: true, value: true },
  })

  return <BulkPricesClient currentCards={cards} />
}
