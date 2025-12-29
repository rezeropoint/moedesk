/**
 * 数据源分析 API
 * GET /api/trendings/analytics/sources - 获取数据源贡献度分析
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { AnalyticsSourcesReq } from "./schema"

interface OverallResult {
  source: string
  total_value: string
  data_count: string
}

interface ByIpResult {
  trending_id: string
  series_title: string
  source: string
  total_value: string
}

interface MetricsResult {
  avg_change: string | null
  top_trending_id: string
  top_series_title: string
  source_count: string
}

const TOTAL_SOURCES = 5 // REDDIT, GOOGLE_TRENDS, ANILIST, TWITTER, BILIBILI

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = AnalyticsSourcesReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数验证失败", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { trendingIds } = parsed.data

  try {
    // 1. 获取总体数据源贡献度
    const overallResults = await db.$queryRawUnsafe<OverallResult[]>(`
      SELECT
        source::text as source,
        SUM(popularity) as total_value,
        COUNT(*) as data_count
      FROM trending_history
      WHERE "trendingId" = ANY($1)
      GROUP BY source
      ORDER BY total_value DESC
    `,
      trendingIds
    )

    // 计算总值和百分比
    const totalValue = overallResults.reduce((sum, r) => sum + Number(r.total_value), 0)
    const overall = overallResults.map((r) => ({
      source: r.source,
      value: Number(r.total_value),
      percentage: totalValue > 0 ? Math.round((Number(r.total_value) / totalValue) * 100) : 0,
      count: Number(r.data_count),
    }))

    // 2. 获取每个 IP 的数据源分布
    const byIpResults = await db.$queryRawUnsafe<ByIpResult[]>(`
      SELECT
        th."trendingId" as trending_id,
        s."titleOriginal" as series_title,
        th.source::text as source,
        SUM(th.popularity) as total_value
      FROM trending_history th
      JOIN trendings t ON t.id = th."trendingId"
      JOIN series s ON s.id = t."seriesId"
      WHERE th."trendingId" = ANY($1)
      GROUP BY th."trendingId", s."titleOriginal", th.source
      ORDER BY th."trendingId", total_value DESC
    `,
      trendingIds
    )

    // 按 IP 分组
    const byIpMap = new Map<string, { seriesTitle: string; sources: { source: string; value: number }[] }>()
    for (const r of byIpResults) {
      if (!byIpMap.has(r.trending_id)) {
        byIpMap.set(r.trending_id, { seriesTitle: r.series_title, sources: [] })
      }
      byIpMap.get(r.trending_id)!.sources.push({
        source: r.source,
        value: Number(r.total_value),
      })
    }

    const byIp = Array.from(byIpMap.entries()).map(([trendingId, data]) => {
      const ipTotal = data.sources.reduce((sum, s) => sum + s.value, 0)
      return {
        trendingId,
        seriesTitle: data.seriesTitle,
        sources: data.sources.map((s) => ({
          source: s.source,
          value: s.value,
          percentage: ipTotal > 0 ? Math.round((s.value / ipTotal) * 100) : 0,
        })),
      }
    })

    // 3. 获取分析指标
    const metricsResults = await db.$queryRawUnsafe<MetricsResult[]>(`
      WITH latest AS (
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity
        FROM trending_history
        WHERE "trendingId" = ANY($1)
        ORDER BY "trendingId", source, "recordedAt" DESC
      ),
      old_7d AS (
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity
        FROM trending_history
        WHERE "trendingId" = ANY($1)
          AND "recordedAt" < NOW() - INTERVAL '7 days'
        ORDER BY "trendingId", source, "recordedAt" DESC
      ),
      changes AS (
        SELECT
          l."trendingId",
          CASE WHEN o.popularity > 0
               THEN ((l.popularity - o.popularity)::numeric / o.popularity * 100)
               ELSE NULL
          END as change_rate,
          l.popularity
        FROM latest l
        LEFT JOIN old_7d o ON l."trendingId" = o."trendingId" AND l.source = o.source
      ),
      top_ip AS (
        SELECT
          c."trendingId",
          s."titleOriginal" as series_title,
          SUM(c.popularity) as total_pop
        FROM changes c
        JOIN trendings t ON t.id = c."trendingId"
        JOIN series s ON s.id = t."seriesId"
        GROUP BY c."trendingId", s."titleOriginal"
        ORDER BY total_pop DESC
        LIMIT 1
      )
      SELECT
        ROUND(AVG(c.change_rate), 2) as avg_change,
        COALESCE(ti."trendingId", '') as top_trending_id,
        COALESCE(ti.series_title, '') as top_series_title,
        COUNT(DISTINCT l.source) as source_count
      FROM latest l
      LEFT JOIN changes c ON l."trendingId" = c."trendingId"
      LEFT JOIN top_ip ti ON TRUE
      GROUP BY ti."trendingId", ti.series_title
    `,
      trendingIds
    )

    const metricsRow = metricsResults[0]
    const metrics = {
      averageChangeRate: metricsRow?.avg_change ? Number(metricsRow.avg_change) : 0,
      topIpId: metricsRow?.top_trending_id || "",
      topIpTitle: metricsRow?.top_series_title || "",
      sourceCoverage: metricsRow?.source_count ? Number(metricsRow.source_count) / TOTAL_SOURCES : 0,
    }

    return Response.json({
      overall,
      byIp,
      metrics,
    })
  } catch (error) {
    console.error("获取数据源分析失败:", error)
    return Response.json({ error: "获取数据源分析失败" }, { status: 500 })
  }
}
