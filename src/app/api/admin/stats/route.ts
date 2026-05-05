// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalUsers, totalOpenings, totalRevenue, popularCases, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.caseOpening.count(),
      prisma.transaction.aggregate({
        where: { type: 'DEPOSIT' },
        _sum: { amount: true },
      }),
      prisma.caseOpening.groupBy({
        by: ['caseId'],
        _count: true,
        orderBy: { _count: { caseId: 'desc' } },
        take: 5,
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, balance: true, createdAt: true, role: true },
      }),
    ])

    // Enrich popular cases
    const caseIds = popularCases.map(c => c.caseId)
    const cases = await prisma.cardCase.findMany({
      where: { id: { in: caseIds } },
      select: { id: true, name: true, price: true, tier: true },
    })

    const enrichedCases = popularCases.map(pc => ({
      ...pc,
      case: cases.find(c => c.id === pc.caseId),
    }))

    return NextResponse.json({
      totalUsers,
      totalOpenings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      popularCases: enrichedCases,
      recentUsers,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
