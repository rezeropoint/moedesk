/**
 * 热度飙升 API
 * GET /api/trendings/surge - 获取热度飙升 IP 列表
 *
 * 从 TrendingHistory 实时计算 7 日变化率，返回综合变化率超过阈值的 IP
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { SurgeQuerySchema } from "./schema"
import { SurgeConfig, type SurgeConfigType } from "@/app/api/configs/[key]/schema"

// 默认配置
const DEFAULT_CONFIG: SurgeConfigType = {
  threshold: 50,
  limit: 5,
  weights: {
    anilist: 0.30,
    google: 0.25,
    reddit: 0.20,
    twitter: 0.15,
    bilibili: 0.10,
  },
}

interface SurgeRawResult {
  trending_id: string
  ip_id: string
  title_original: string
  title_chinese: string | null
  cover_image: string | null
  type: string
  total_score: number
  anilist_change: number | null
  google_change: number | null
  reddit_change: number | null
  composite_change: number | null
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 解析查询参数
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = SurgeQuerySchema.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // 获取配置
    let config: SurgeConfigType = { ...DEFAULT_CONFIG }

    const dbConfig = await db.systemConfig.findUnique({
      where: { key: "surge_config" },
    })

    if (dbConfig) {
      const configValue = SurgeConfig.safeParse(JSON.parse(dbConfig.value))
      if (configValue.success) {
        config = configValue.data
      }
    }

    // 查询参数可覆盖配置
    const threshold = parsed.data.threshold ?? config.threshold
    const limit = parsed.data.limit ?? config.limit
    const weights = config.weights

    // 使用原生 SQL 从 TrendingHistory 实时计算变化率
    const surgeItems = await db.$queryRawUnsafe<SurgeRawResult[]>(`
      WITH latest AS (
        -- 每个 IP 每个数据源的最新记录
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity,
          "recordedAt"
        FROM trending_history
        ORDER BY "trendingId", source, "recordedAt" DESC
      ),
      old AS (
        -- 7天前最近的记录
        SELECT DISTINCT ON ("trendingId", source)
          "trendingId",
          source,
          popularity
        FROM trending_history
        WHERE "recordedAt" < NOW() - INTERVAL '7 days'
        ORDER BY "trendingId", source, "recordedAt" DESC
      ),
      changes AS (
        -- 计算各数据源变化率
        SELECT
          l."trendingId",
          l.source,
          CASE
            WHEN o.popularity IS NULL THEN NULL
            WHEN o.popularity = 0 THEN NULL
            ELSE ROUND(((l.popularity - o.popularity)::numeric / o.popularity * 100), 2)
          END AS change_rate
        FROM latest l
        LEFT JOIN old o ON l."trendingId" = o."trendingId" AND l.source = o.source
      ),
      pivoted AS (
        -- 转换为每个 Trending 一行，各数据源变化率为列
        SELECT
          "trendingId",
          MAX(CASE WHEN source = 'ANILIST' THEN change_rate END) AS anilist_change,
          MAX(CASE WHEN source = 'GOOGLE_TRENDS' THEN change_rate END) AS google_change,
          MAX(CASE WHEN source = 'REDDIT' THEN change_rate END) AS reddit_change,
          MAX(CASE WHEN source = 'TWITTER' THEN change_rate END) AS twitter_change,
          MAX(CASE WHEN source = 'BILIBILI' THEN change_rate END) AS bili_change
        FROM changes
        GROUP BY "trendingId"
      ),
      weighted AS (
        -- 计算加权综合变化率
        SELECT
          p."trendingId",
          p.anilist_change,
          p.google_change,
          p.reddit_change,
          -- 加权平均（只计算有数据的源）
          CASE
            WHEN (
              CASE WHEN p.anilist_change IS NOT NULL THEN $1 ELSE 0 END +
              CASE WHEN p.google_change IS NOT NULL THEN $2 ELSE 0 END +
              CASE WHEN p.reddit_change IS NOT NULL THEN $3 ELSE 0 END +
              CASE WHEN p.twitter_change IS NOT NULL THEN $4 ELSE 0 END +
              CASE WHEN p.bili_change IS NOT NULL THEN $5 ELSE 0 END
            ) = 0 THEN NULL
            ELSE ROUND((
              COALESCE(p.anilist_change, 0) * $1 +
              COALESCE(p.google_change, 0) * $2 +
              COALESCE(p.reddit_change, 0) * $3 +
              COALESCE(p.twitter_change, 0) * $4 +
              COALESCE(p.bili_change, 0) * $5
            ) / (
              CASE WHEN p.anilist_change IS NOT NULL THEN $1 ELSE 0 END +
              CASE WHEN p.google_change IS NOT NULL THEN $2 ELSE 0 END +
              CASE WHEN p.reddit_change IS NOT NULL THEN $3 ELSE 0 END +
              CASE WHEN p.twitter_change IS NOT NULL THEN $4 ELSE 0 END +
              CASE WHEN p.bili_change IS NOT NULL THEN $5 ELSE 0 END
            ), 2)
          END AS composite_change
        FROM pivoted p
      )
      SELECT
        t.id AS trending_id,
        ir.id AS ip_id,
        ir."titleOriginal" AS title_original,
        ir."titleChinese" AS title_chinese,
        ir."coverImage" AS cover_image,
        ir.type::text AS type,
        ir."totalScore" AS total_score,
        w.anilist_change,
        w.google_change,
        w.reddit_change,
        w.composite_change
      FROM weighted w
      JOIN trendings t ON t.id = w."trendingId"
      JOIN ip_reviews ir ON ir.id = t."ipId"
      WHERE ir.status = 'APPROVED'
        AND w.composite_change IS NOT NULL
        AND w.composite_change >= $6
      ORDER BY w.composite_change DESC
      LIMIT $7
    `,
      weights.anilist,
      weights.google,
      weights.reddit,
      weights.twitter,
      weights.bilibili,
      threshold,
      limit
    )

    // 转换为前端需要的格式
    const items = surgeItems.map((item) => ({
      id: item.trending_id,
      ipId: item.ip_id,
      titleOriginal: item.title_original,
      titleChinese: item.title_chinese,
      coverImage: item.cover_image,
      type: item.type,
      totalScore: item.total_score,
      compositeChange: Number(item.composite_change),
      sourceChanges: {
        anilist: item.anilist_change !== null ? Number(item.anilist_change) : undefined,
        google: item.google_change !== null ? Number(item.google_change) : undefined,
        reddit: item.reddit_change !== null ? Number(item.reddit_change) : undefined,
      },
    }))

    return Response.json({
      data: {
        items,
        config: { threshold, limit, weights },
      },
    })
  } catch (error) {
    console.error("Failed to fetch surge data:", error)
    return Response.json({ error: "获取飙升数据失败" }, { status: 500 })
  }
}
