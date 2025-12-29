/**
 * Series 系列统计更新函数
 */

import { db } from "@/lib/db"

/**
 * 更新系列统计数据
 * - totalSeasons: 关联的 Entry 数量
 * - aggregatedScore: 所有季度的最高分
 */
export async function updateSeriesStats(seriesId: string) {
  // 获取该系列下所有已审核通过的季度
  const seasons = await db.entry.findMany({
    where: {
      seriesId,
      status: "APPROVED",
    },
    select: {
      totalScore: true,
    },
  })

  const totalSeasons = seasons.length
  // 取最高分作为综合分（也可以用平均分）
  const aggregatedScore =
    seasons.length > 0
      ? Math.max(...seasons.map((s) => s.totalScore))
      : 0

  await db.series.update({
    where: { id: seriesId },
    data: {
      totalSeasons,
      aggregatedScore,
    },
  })

  return { totalSeasons, aggregatedScore }
}

/**
 * 批量更新所有系列统计
 */
export async function updateAllSeriesStats() {
  const seriesList = await db.series.findMany({
    select: { id: true },
  })

  const results = await Promise.all(
    seriesList.map((s) => updateSeriesStats(s.id))
  )

  return {
    updated: seriesList.length,
    results,
  }
}
