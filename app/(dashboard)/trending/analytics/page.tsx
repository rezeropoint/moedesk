import { db } from "@/lib/db"
import { AnalyticsContainer } from "@/components/trending/analytics/analytics-container"
import type { SelectedIp } from "@/types/analytics"

/** 获取热门 Top N IP */
async function getTopTrendingIps(limit: number): Promise<SelectedIp[]> {
  const trendings = await db.trending.findMany({
    include: {
      series: {
        select: {
          id: true,
          titleOriginal: true,
          titleChinese: true,
          coverImage: true,
          type: true,
          aggregatedScore: true,
        },
      },
    },
    orderBy: {
      series: {
        aggregatedScore: "desc",
      },
    },
    take: limit,
  })

  return trendings.map((t) => ({
    trendingId: t.id,
    seriesId: t.series.id,
    titleOriginal: t.series.titleOriginal,
    titleChinese: t.series.titleChinese,
    coverImage: t.series.coverImage,
    type: t.series.type,
  }))
}

export default async function AnalyticsPage() {
  // 获取热门 Top 3 作为初始选择
  const initialIps = await getTopTrendingIps(3)

  return (
    <div className="p-6">
      <AnalyticsContainer initialIps={initialIps} />
    </div>
  )
}
