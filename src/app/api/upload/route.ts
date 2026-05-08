// src/app/api/upload/route.ts
import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG, PNG, WebP, or GIF.' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Sanitize filename to avoid issues with spaces / special chars
    const ext = file.name.split('.').pop() ?? 'png'
    const safeName = `tcg-${Date.now()}.${ext}`

    const blob = await put(safeName, file, { access: 'public' })
    return NextResponse.json({ url: blob.url })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 })
  }
}
