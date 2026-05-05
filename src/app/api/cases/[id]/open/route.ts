// src/app/api/cases/[id]/open/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { openCase } from '@/lib/opening-engine'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to open cases' }, { status: 401 })
    }

    const result = await openCase(params.id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      cards: result.cards,
      newBalance: result.newBalance,
    })
  } catch (error) {
    console.error('Case opening error:', error)
    return NextResponse.json({ error: 'Failed to open case' }, { status: 500 })
  }
}
