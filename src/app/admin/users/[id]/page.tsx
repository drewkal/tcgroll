export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminUserDetailClient } from './client'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')
  const { id } = await params
  return <AdminUserDetailClient userId={id} />
}
