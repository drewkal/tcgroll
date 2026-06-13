// src/app/admin/users/page.tsx
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminUsersClient } from './client'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')
  return <AdminUsersClient />
}
