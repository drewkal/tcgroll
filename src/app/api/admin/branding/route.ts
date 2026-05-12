// src/app/api/admin/branding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { setSetting, getSettings } from '@/lib/settings'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Unauthorized')
}

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const settings = await getSettings(['logo_header', 'logo_footer'])
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const form = await req.formData()
  const slot = form.get('slot') as string   // 'logo_header' | 'logo_footer'
  const file = form.get('file') as File | null

  if (!slot || !['logo_header', 'logo_footer'].includes(slot))
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 })

  const ext  = file.name.split('.').pop() ?? 'png'
  const blob = await put(`branding/${slot}.${ext}`, file, { access: 'public' })

  await setSetting(slot as any, blob.url)
  return NextResponse.json({ url: blob.url })
}

export async function DELETE(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { slot } = await req.json()
  if (!['logo_header', 'logo_footer'].includes(slot))
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  await setSetting(slot as any, '')
  return NextResponse.json({ ok: true })
}
