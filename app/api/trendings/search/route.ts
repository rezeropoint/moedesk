/**
 * IP 搜索 API
 * GET /api/trendings/search - 搜索有热度追踪的 IP
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { TrendingSearchReq } from "./schema"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = TrendingSearchReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数验证失败", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { q, limit } = parsed.data

  try {
    // 搜索有热度追踪的系列
    const results = await db.trending.findMany({
      where: {
        series: {
          OR: [
            { titleOriginal: { contains: q, mode: "insensitive" } },
            { titleChinese: { contains: q, mode: "insensitive" } },
            { titleEnglish: { contains: q, mode: "insensitive" } },
            { searchKeywords: { has: q } },
          ],
        },
      },
      include: {
        series: {
          select: {
            id: true,
            titleOriginal: true,
            titleChinese: true,
            coverImage: true,
            type: true,
            aggregatedScore: true,
          },
        },
      },
      orderBy: {
        series: {
          aggregatedScore: "desc",
        },
      },
      take: limit,
    })

    const data = results.map((t) => ({
      trendingId: t.id,
      seriesId: t.series.id,
      titleOriginal: t.series.titleOriginal,
      titleChinese: t.series.titleChinese,
      coverImage: t.series.coverImage,
      type: t.series.type,
      aggregatedScore: t.series.aggregatedScore,
    }))

    return Response.json({ data })
  } catch (error) {
    console.error("搜索失败:", error)
    return Response.json({ error: "搜索失败" }, { status: 500 })
  }
}
