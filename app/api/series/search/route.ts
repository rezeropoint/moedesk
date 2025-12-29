/**
 * Series 搜索 API - 用于审核时选择系列
 */

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { SeriesSearchReq } from "../schema"

/** GET /api/series/search?q=xxx - 搜索系列 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const parsed = SeriesSearchReq.safeParse({
    q: searchParams.get("q") || "",
    limit: searchParams.get("limit") || 10,
  })

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { q, limit } = parsed.data

  // 搜索标题（原始、中文、英文）和搜索关键词
  const seriesList = await db.series.findMany({
    where: {
      OR: [
        { titleOriginal: { contains: q, mode: "insensitive" } },
        { titleChinese: { contains: q, mode: "insensitive" } },
        { titleEnglish: { contains: q, mode: "insensitive" } },
        { searchKeywords: { has: q } },
      ],
    },
    orderBy: { aggregatedScore: "desc" },
    take: limit,
    select: {
      id: true,
      titleOriginal: true,
      titleChinese: true,
      type: true,
      coverImage: true,
      totalSeasons: true,
    },
  })

  return Response.json({
    data: {
      items: seriesList,
    },
  })
}
