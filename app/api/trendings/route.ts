/**
 * 热度追踪 API
 * GET /api/trendings - 获取热度数据列表
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { TrendingListReq } from "./schema"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = TrendingListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { type, status, page, pageSize } = parsed.data

  try {
    const where = {
      ...(status && { status }),
      series: {
        ...(type && { type }),
      },
    }

    const trendings = await db.trending.findMany({
      where,
      orderBy: { series: { aggregatedScore: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        series: {
          select: {
            id: true,
            type: true,
            titleOriginal: true,
            titleChinese: true,
            titleEnglish: true,
            description: true,
            coverImage: true,
            tags: true,
            totalSeasons: true,
            aggregatedScore: true,
            searchKeywords: true,
            // 获取该系列所有已审核的 Entry（季度数据）
            entries: {
              where: { status: "APPROVED" },
              orderBy: [{ seasonNumber: "asc" }, { releaseDate: "desc" }],
              select: {
                id: true,
                seasonNumber: true,
                seasonLabel: true,
                titleOriginal: true,
                titleChinese: true,
                coverImage: true,
                releaseDate: true,
                endDate: true,
                popularityScore: true,
                ratingScore: true,
                totalScore: true,
              },
            },
          },
        },
      },
    })

    const total = await db.trending.count({ where })

    const items = trendings.map((t, index) => {
      const discussionCount =
        (t.redditKarma || 0) + (t.twitterMentions || 0) + (t.biliDanmaku || 0)

      const sources: string[] = []
      if (t.redditKarma) sources.push("Reddit")
      if (t.twitterMentions) sources.push("Twitter")
      if (t.googleTrend) sources.push("Google")
      if (t.biliDanmaku) sources.push("Bilibili")

      // 最新一季用于显示系列级日期
      const latestEntry = t.series.entries[t.series.entries.length - 1]
      // 最高分季度用于显示 AniList 数据
      const topScoreEntry = t.series.entries.reduce(
        (max, e) => ((e.totalScore ?? 0) > (max?.totalScore ?? 0) ? e : max),
        t.series.entries[0]
      )

      return {
        id: t.id,
        rank: (page - 1) * pageSize + index + 1,
        series: {
          id: t.series.id,
          type: t.series.type,
          titleOriginal: t.series.titleOriginal,
          titleChinese: t.series.titleChinese,
          titleEnglish: t.series.titleEnglish,
          description: t.series.description,
          coverImage: t.series.coverImage,
          tags: t.series.tags,
          totalSeasons: t.series.totalSeasons,
          aggregatedScore: t.series.aggregatedScore,
          searchKeywords: t.series.searchKeywords,
          releaseDate: latestEntry?.releaseDate?.toISOString() ?? null,
          endDate: latestEntry?.endDate?.toISOString() ?? null,
        },
        // 所有已审核的季度条目
        entries: t.series.entries.map((e) => ({
          id: e.id,
          seasonNumber: e.seasonNumber,
          seasonLabel: e.seasonLabel,
          titleOriginal: e.titleOriginal,
          titleChinese: e.titleChinese,
          coverImage: e.coverImage,
          releaseDate: e.releaseDate?.toISOString() ?? null,
          endDate: e.endDate?.toISOString() ?? null,
          popularityScore: e.popularityScore,
          ratingScore: e.ratingScore,
          totalScore: e.totalScore ?? 0,
        })),
        totalScore: t.series.aggregatedScore,
        growthRate: Math.floor((t.series.aggregatedScore % 300) + 50),
        primarySource: sources[0] || "AniList",
        sources: sources.length > 0 ? sources : ["AniList"],
        discussionCount,
        lastUpdated: t.updatedAt.toISOString(),
        status: t.status,
        heatData: {
          // AniList 数据（从最高分 Entry 获取）
          anilistScore: t.series.aggregatedScore,
          anilistPopularity: topScoreEntry?.popularityScore ?? null,
          anilistRating: topScoreEntry?.ratingScore ?? null,
          // 社媒热度
          redditKarma: t.redditKarma,
          googleTrend: t.googleTrend,
          twitterMentions: t.twitterMentions,
          biliDanmaku: t.biliDanmaku,
        },
      }
    })

    return Response.json({
      data: {
        items,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    console.error("Failed to fetch trendings:", error)
    return Response.json({ error: "获取热度数据失败" }, { status: 500 })
  }
}

