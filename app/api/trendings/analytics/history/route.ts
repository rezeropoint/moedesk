/**
 * 历史数据 API
 * GET /api/trendings/analytics/history - 获取指定 IP 的历史热度数据（时序）
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { AnalyticsHistoryReq } from "./schema"

interface HistoryRawResult {
  date: Date
  trending_id: string
  series_title: string
  source: string
  popularity: string
  rating: string | null
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = AnalyticsHistoryReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数验证失败", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { trendingIds, days, source, region } = parsed.data

  try {
    // 构建数据源筛选条件
    const sourceCondition = source === "ALL" ? "" : `AND th.source = '${source}'`

    const results = await db.$queryRawUnsafe<HistoryRawResult[]>(`
      SELECT
        DATE(th."recordedAt") as date,
        th."trendingId" as trending_id,
        s."titleOriginal" as series_title,
        th.source::text as source,
        ROUND(AVG(th.popularity)) as popularity,
        ROUND(AVG(th.rating)) as rating
      FROM trending_history th
      JOIN trendings t ON t.id = th."trendingId"
      JOIN series s ON s.id = t."seriesId"
      WHERE th."trendingId" = ANY($1)
        AND th."recordedAt" >= NOW() - INTERVAL '${days} days'
        AND th.region = $2
        ${sourceCondition}
      GROUP BY DATE(th."recordedAt"), th."trendingId", s."titleOriginal", th.source
      ORDER BY date ASC, th."trendingId", th.source
    `,
      trendingIds,
      region
    )

    // 转换数据格式
    const data = results.map((row) => ({
      date: row.date.toISOString().split("T")[0],
      trendingId: row.trending_id,
      seriesTitle: row.series_title,
      source: row.source,
      popularity: Number(row.popularity),
      rating: row.rating ? Number(row.rating) : null,
    }))

    // 计算元数据
    const dates = data.map((d) => d.date)
    const sources = [...new Set(data.map((d) => d.source))]

    return Response.json({
      data,
      meta: {
        startDate: dates.length > 0 ? dates[0] : null,
        endDate: dates.length > 0 ? dates[dates.length - 1] : null,
        sources,
      },
    })
  } catch (error) {
    console.error("获取历史数据失败:", error)
    return Response.json({ error: "获取历史数据失败" }, { status: 500 })
  }
}
