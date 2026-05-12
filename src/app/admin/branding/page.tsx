// src/app/admin/branding/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/settings'
import { BrandingClient } from './client'

export default async function AdminBrandingPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')
  const settings = await getSettings(['logo_header', 'logo_footer'])
  return <BrandingClient initial={settings} />
}
