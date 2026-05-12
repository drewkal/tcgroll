// src/app/admin/social/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SocialAdminClient } from './client'

export default async function AdminSocialPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')

  const links = await prisma.socialLink.findMany({ orderBy: { order: 'asc' } })
  return <SocialAdminClient initialLinks={links} />
}
