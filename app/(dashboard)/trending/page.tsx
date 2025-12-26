/**
 * 热点雷达页面
 * 展示已入库 IP + 热度数据，支持 IP 审核
 */

import { Flame, RefreshCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TrendingStatsCards } from "@/components/trending/trending-stats"
import { TrendingTabs } from "@/components/trending/trending-tabs"
import { TrendingSidePanel } from "@/components/trending/trending-side-panel"
import { getTrendingStats } from "@/lib/trending"
import { db } from "@/lib/db"
import type { TrendingListItem, IpType, TrendingStatus } from "@/types/trending"

export const dynamic = "force-dynamic"

export default async function TrendingPage() {
  // 计算30天后的日期
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // 并行获取数据
  const [stats, trendings, pendingReviews, endingSoonAnime] = await Promise.all([
    getTrendingStats(),
    db.trending.findMany({
      take: 20,
      orderBy: { ip: { totalScore: "desc" } },
      include: {
        ip: {
          select: {
            id: true,
            type: true,
            titleOriginal: true,
            titleChinese: true,
            titleEnglish: true,
            description: true,
            coverImage: true,
            tags: true,
            releaseDate: true,
            popularityScore: true,
            ratingScore: true,
            totalScore: true,
          },
        },
      },
    }),
    db.ipReview.findMany({
      where: { status: "PENDING" },
      take: 20,
      orderBy: { totalScore: "desc" },
      select: {
        id: true,
        type: true,
        titleOriginal: true,
        titleChinese: true,
        titleEnglish: true,
        description: true,
        coverImage: true,
        tags: true,
        releaseDate: true,
        popularityScore: true,
        ratingScore: true,
        totalScore: true,
        status: true,
        createdAt: true,
      },
    }),
    // 获取即将完结番（endDate 在未来30天内，且已通过审核）
    db.ipReview.findMany({
      where: {
        type: "ANIME",
        status: "APPROVED",
        endDate: {
          gte: now,
          lte: thirtyDaysLater,
        },
      },
      take: 5,
      orderBy: { endDate: "asc" },
      select: {
        id: true,
        titleOriginal: true,
        titleChinese: true,
        coverImage: true,
        endDate: true,
      },
    }),
  ])

  // 转换热度数据为列表项格式
  const trendingItems: TrendingListItem[] = trendings.map((t, index) => {
    const discussionCount =
      (t.redditKarma || 0) + (t.twitterMentions || 0) + (t.biliDanmaku || 0)

    const sources: string[] = []
    if (t.redditKarma) sources.push("Reddit")
    if (t.twitterMentions) sources.push("Twitter")
    if (t.googleTrend) sources.push("Google")
    if (t.biliDanmaku) sources.push("Bilibili")

    const heatLevel: 1 | 2 | 3 =
      t.ip.totalScore >= 8000 ? 3 : t.ip.totalScore >= 5000 ? 2 : 1

    return {
      id: t.id,
      rank: index + 1,
      ip: {
        id: t.ip.id,
        type: t.ip.type as IpType,
        titleOriginal: t.ip.titleOriginal,
        titleChinese: t.ip.titleChinese,
        titleEnglish: t.ip.titleEnglish,
        description: t.ip.description,
        coverImage: t.ip.coverImage,
        tags: t.ip.tags,
        releaseDate: t.ip.releaseDate?.toISOString() ?? null,
        popularityScore: t.ip.popularityScore,
        ratingScore: t.ip.ratingScore,
        totalScore: t.ip.totalScore,
      },
      totalScore: t.ip.totalScore,
      growthRate: Math.floor((t.ip.totalScore % 300) + 50), // 基于分数计算增长率
      heatLevel,
      primarySource: sources[0] || "AniList",
      sources: sources.length > 0 ? sources : ["AniList"],
      discussionCount,
      lastUpdated: t.updatedAt.toISOString(),
      status: t.status as TrendingStatus,
      heatData: {
        redditKarma: t.redditKarma,
        googleTrend: t.googleTrend,
        twitterMentions: t.twitterMentions,
        biliDanmaku: t.biliDanmaku,
      },
    }
  })

  // 转换待审核数据
  const pendingReviewItems = pendingReviews.map((item) => ({
    id: item.id,
    type: item.type as IpType,
    titleOriginal: item.titleOriginal,
    titleChinese: item.titleChinese,
    titleEnglish: item.titleEnglish,
    description: item.description,
    coverImage: item.coverImage,
    tags: item.tags,
    releaseDate: item.releaseDate?.toISOString() ?? null,
    popularityScore: item.popularityScore,
    ratingScore: item.ratingScore,
    totalScore: item.totalScore,
    status: item.status as "PENDING" | "APPROVED" | "REJECTED",
    createdAt: item.createdAt.toISOString(),
  }))

  // 转换即将完结番数据
  const endingSoonItems = endingSoonAnime.map((anime) => {
    const endDate = anime.endDate as Date
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      id: anime.id,
      titleOriginal: anime.titleOriginal,
      titleChinese: anime.titleChinese,
      coverImage: anime.coverImage,
      endDate: endDate.toISOString(),
      daysRemaining,
    }
  })

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">热点雷达</h1>
            <p className="text-muted-foreground">
              实时追踪二次元热点，共 {stats.totalTrendings} 个 IP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-2" />
            最后更新: 5分钟前
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            立即刷新
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <TrendingStatsCards stats={stats} />

      {/* 主内容区：左侧列表 + 右侧面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* 左侧：热点列表/待审核 */}
        <TrendingTabs
          initialTrendings={trendingItems}
          initialPendingReviews={pendingReviewItems}
          pendingCount={stats.pendingReviews}
        />

        {/* 右侧：侧边面板 */}
        <TrendingSidePanel endingSoonItems={endingSoonItems} />
      </div>
    </div>
  )
}
