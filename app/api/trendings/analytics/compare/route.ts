/**
 * 变化率对比 API
 * GET /api/trendings/analytics/compare - 获取多个 IP 的变化率对比数据
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { AnalyticsCompareReq } from "./schema"

interface CompareRawResult {
  trending_id: string
  series_id: string
  title_original: string
  title_chinese: string | null
  cover_image: string | null
  type: string
  status: string
  change_7d: string | null
  change_30d: string | null
  change_90d: string | null
  reddit_value: string | null
  google_value: string | null
  anilist_value: string | null
  twitter_value: string | null
  bilibili_value: string | null
  reddit_change: string | null
  google_change: string | null
  anilist_change: string | null
  twitter_change: string | null
  bilibili_change: string | null
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = AnalyticsCompareReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数验证失败", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { trendingIds } = parsed.data

  try {
    const results = await db.$queryRawUnsafe<CompareRawResult[]>(`
      WITH latest AS (
        -- 每个 IP 每个数据源的最新记录
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity,
          "recordedAt"
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
      old_30d AS (
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity
        FROM trending_history
        WHERE "trendingId" = ANY($1)
          AND "recordedAt" < NOW() - INTERVAL '30 days'
        ORDER BY "trendingId", source, "recordedAt" DESC
      ),
      old_90d AS (
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity
        FROM trending_history
        WHERE "trendingId" = ANY($1)
          AND "recordedAt" < NOW() - INTERVAL '90 days'
        ORDER BY "trendingId", source, "recordedAt" DESC
      ),
      source_values AS (
        SELECT
          l."trendingId",
          MAX(CASE WHEN l.source = 'REDDIT' THEN l.popularity END) as reddit_value,
          MAX(CASE WHEN l.source = 'GOOGLE_TRENDS' THEN l.popularity END) as google_value,
          MAX(CASE WHEN l.source = 'ANILIST' THEN l.popularity END) as anilist_value,
          MAX(CASE WHEN l.source = 'TWITTER' THEN l.popularity END) as twitter_value,
          MAX(CASE WHEN l.source = 'BILIBILI' THEN l.popularity END) as bilibili_value
        FROM latest l
        GROUP BY l."trendingId"
      ),
      source_changes AS (
        SELECT
          l."trendingId",
          MAX(CASE WHEN l.source = 'REDDIT' AND o7.popularity > 0
              THEN ROUND(((l.popularity - o7.popularity)::numeric / o7.popularity * 100), 2) END) as reddit_change,
          MAX(CASE WHEN l.source = 'GOOGLE_TRENDS' AND o7.popularity > 0
              THEN ROUND(((l.popularity - o7.popularity)::numeric / o7.popularity * 100), 2) END) as google_change,
          MAX(CASE WHEN l.source = 'ANILIST' AND o7.popularity > 0
              THEN ROUND(((l.popularity - o7.popularity)::numeric / o7.popularity * 100), 2) END) as anilist_change,
          MAX(CASE WHEN l.source = 'TWITTER' AND o7.popularity > 0
              THEN ROUND(((l.popularity - o7.popularity)::numeric / o7.popularity * 100), 2) END) as twitter_change,
          MAX(CASE WHEN l.source = 'BILIBILI' AND o7.popularity > 0
              THEN ROUND(((l.popularity - o7.popularity)::numeric / o7.popularity * 100), 2) END) as bilibili_change
        FROM latest l
        LEFT JOIN old_7d o7 ON l."trendingId" = o7."trendingId" AND l.source = o7.source
        GROUP BY l."trendingId"
      ),
      composite_changes AS (
        SELECT
          l."trendingId",
          -- 7天综合变化率（加权平均）
          CASE WHEN (
            CASE WHEN o7.popularity > 0 THEN 1 ELSE 0 END
          ) = 0 THEN NULL
          ELSE ROUND(AVG(
            CASE WHEN o7.popularity > 0
                 THEN ((l.popularity - o7.popularity)::numeric / o7.popularity * 100)
                 ELSE NULL
            END
          ), 2) END as change_7d,
          -- 30天综合变化率
          ROUND(AVG(
            CASE WHEN o30.popularity > 0
                 THEN ((l.popularity - o30.popularity)::numeric / o30.popularity * 100)
                 ELSE NULL
            END
          ), 2) as change_30d,
          -- 90天综合变化率
          ROUND(AVG(
            CASE WHEN o90.popularity > 0
                 THEN ((l.popularity - o90.popularity)::numeric / o90.popularity * 100)
                 ELSE NULL
            END
          ), 2) as change_90d
        FROM latest l
        LEFT JOIN old_7d o7 ON l."trendingId" = o7."trendingId" AND l.source = o7.source
        LEFT JOIN old_30d o30 ON l."trendingId" = o30."trendingId" AND l.source = o30.source
        LEFT JOIN old_90d o90 ON l."trendingId" = o90."trendingId" AND l.source = o90.source
        GROUP BY l."trendingId"
      )
      SELECT
        t.id as trending_id,
        s.id as series_id,
        s."titleOriginal" as title_original,
        s."titleChinese" as title_chinese,
        s."coverImage" as cover_image,
        s.type::text as type,
        t.status::text as status,
        cc.change_7d,
        cc.change_30d,
        cc.change_90d,
        sv.reddit_value,
        sv.google_value,
        sv.anilist_value,
        sv.twitter_value,
        sv.bilibili_value,
        sc.reddit_change,
        sc.google_change,
        sc.anilist_change,
        sc.twitter_change,
        sc.bilibili_change
      FROM trendings t
      JOIN series s ON s.id = t."seriesId"
      LEFT JOIN composite_changes cc ON cc."trendingId" = t.id
      LEFT JOIN source_values sv ON sv."trendingId" = t.id
      LEFT JOIN source_changes sc ON sc."trendingId" = t.id
      WHERE t.id = ANY($1)
      ORDER BY cc.change_7d DESC NULLS LAST
    `,
      trendingIds
    )

    const data = results.map((row) => ({
      trendingId: row.trending_id,
      seriesId: row.series_id,
      titleOriginal: row.title_original,
      titleChinese: row.title_chinese,
      coverImage: row.cover_image,
      type: row.type,
      status: row.status,
      change7d: row.change_7d ? Number(row.change_7d) : null,
      change30d: row.change_30d ? Number(row.change_30d) : null,
      change90d: row.change_90d ? Number(row.change_90d) : null,
      sourceValues: {
        reddit: row.reddit_value ? Number(row.reddit_value) : null,
        google: row.google_value ? Number(row.google_value) : null,
        anilist: row.anilist_value ? Number(row.anilist_value) : null,
        twitter: row.twitter_value ? Number(row.twitter_value) : null,
        bilibili: row.bilibili_value ? Number(row.bilibili_value) : null,
      },
      sourceChanges: {
        reddit: row.reddit_change ? Number(row.reddit_change) : null,
        google: row.google_change ? Number(row.google_change) : null,
        anilist: row.anilist_change ? Number(row.anilist_change) : null,
        twitter: row.twitter_change ? Number(row.twitter_change) : null,
        bilibili: row.bilibili_change ? Number(row.bilibili_change) : null,
      },
    }))

    return Response.json({ data })
  } catch (error) {
    console.error("获取对比数据失败:", error)
    return Response.json({ error: "获取对比数据失败" }, { status: 500 })
  }
}
