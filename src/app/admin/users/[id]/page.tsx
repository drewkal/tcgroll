export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminUserDetailClient } from './client'

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')
  return <AdminUserDetailClient userId={params.id} />
}
