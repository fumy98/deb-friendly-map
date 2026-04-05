import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports?south=&north=&west=&east=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const south = parseFloat(searchParams.get('south') ?? '0')
  const north = parseFloat(searchParams.get('north') ?? '0')
  const west  = parseFloat(searchParams.get('west')  ?? '0')
  const east  = parseFloat(searchParams.get('east')  ?? '0')

  const reports = await prisma.report.findMany({
    where: {
      status: 'ACTIVE',
      latitude:  { gte: south, lte: north },
      longitude: { gte: west,  lte: east  },
    },
    include: {
      categories: true,
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(reports)
}

// POST /api/reports
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { latitude, longitude, severity, title, description, categorySlugs } = body

  if (!latitude || !longitude || !severity || !categorySlugs?.length) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  // 暫定: 認証なしでゲストユーザーとして投稿（認証実装後に差し替え）
  let user = await prisma.user.findFirst({ where: { email: 'guest@example.com' } })
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'guest@example.com', name: 'ゲスト' },
    })
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
  })

  const report = await prisma.report.create({
    data: {
      userId: user.id,
      latitude,
      longitude,
      severity,
      title,
      description,
      categories: { connect: categories.map(c => ({ id: c.id })) },
    },
    include: { categories: true },
  })

  return NextResponse.json(report, { status: 201 })
}
