/**
 * 热点雷达相关数据获取函数
 */

import { db } from "@/lib/db"
import type { TrendingStatsItemType } from "@/app/api/trendings/schema"

/** 获取统计数据（供页面 Server Component 使用） */
export async function getTrendingStats(): Promise<TrendingStatsItemType> {
  const [totalEntries, totalTrendings, pendingReviews, statusCounts] =
    await Promise.all([
      db.entry.count({ where: { status: "APPROVED" } }),
      db.trending.count(),
      db.entry.count({ where: { status: "PENDING" } }),
      db.trending.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ])

  const countMap = new Map(statusCounts.map((s) => [s.status, s._count.status]))

  return {
    totalIps: totalEntries,
    totalTrendings,
    pendingReviews,
    watchingCount: countMap.get("WATCHING") || 0,
    focusedCount: countMap.get("FOCUSED") || 0,
    inProgressCount: countMap.get("IN_PROGRESS") || 0,
  }
}
