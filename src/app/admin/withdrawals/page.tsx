// src/app/admin/withdrawals/page.tsx
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Truck } from 'lucide-react'
import { AdminWithdrawalsClient } from './client'

async function getData() {
  return prisma.withdrawRequest.findMany({
    include: {
      user:  { select: { name: true, email: true } },
      cards: { include: { userCard: { include: { card: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminWithdrawalsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const withdrawals = await getData()
  return <AdminWithdrawalsClient withdrawals={withdrawals as any} />
}
