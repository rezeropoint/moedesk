/**
 * Series API - 列表 + 创建
 */

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { SeriesListReq, CreateSeriesReq } from "./schema"

/** GET /api/franchises - 获取系列列表 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const parsed = SeriesListReq.safeParse({
    type: searchParams.get("type") || undefined,
    page: searchParams.get("page") || 1,
    pageSize: searchParams.get("pageSize") || 20,
  })

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { type, page, pageSize } = parsed.data

  const where = {
    ...(type && { type }),
  }

  const [seriesList, total] = await Promise.all([
    db.series.findMany({
      where,
      orderBy: { aggregatedScore: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        titleOriginal: true,
        titleChinese: true,
        titleEnglish: true,
        type: true,
        coverImage: true,
        tags: true,
        totalSeasons: true,
        aggregatedScore: true,
        createdAt: true,
      },
    }),
    db.series.count({ where }),
  ])

  return Response.json({
    data: {
      items: seriesList.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    },
  })
}

/** POST /api/franchises - 创建系列 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = CreateSeriesReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const series = await db.series.create({
    data: {
      ...parsed.data,
      // 自动添加标题到搜索关键词
      searchKeywords: [
        ...parsed.data.searchKeywords,
        parsed.data.titleOriginal,
        ...(parsed.data.titleChinese ? [parsed.data.titleChinese] : []),
        ...(parsed.data.titleEnglish ? [parsed.data.titleEnglish] : []),
      ].filter((v, i, a) => a.indexOf(v) === i), // 去重
    },
  })

  // 同时创建 Trending 记录
  await db.trending.create({
    data: {
      seriesId: series.id,
      status: "WATCHING",
    },
  })

  return Response.json({
    data: {
      id: series.id,
      titleOriginal: series.titleOriginal,
    },
  })
}
