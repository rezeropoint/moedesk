/**
 * 热点雷达统计卡片组件
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, TrendingUp, Clock, Eye, Star, Zap } from "lucide-react"
import type { TrendingStats } from "@/types/trending"
import { cn } from "@/lib/utils"

interface TrendingStatsCardsProps {
  stats: TrendingStats
}

export function TrendingStatsCards({ stats }: TrendingStatsCardsProps) {
  const cards = [
    {
      title: "IP 总数",
      value: stats.totalIps,
      icon: Database,
      color: "text-status-info",
      bgColor: "bg-status-info-bg",
    },
    {
      title: "追踪中",
      value: stats.totalTrendings,
      icon: TrendingUp,
      color: "text-status-success",
      bgColor: "bg-status-success-bg",
    },
    {
      title: "待审核",
      value: stats.pendingReviews,
      icon: Clock,
      color: "text-status-warning",
      bgColor: "bg-status-warning-bg",
      highlight: stats.pendingReviews > 0,
    },
    {
      title: "观望中",
      value: stats.watchingCount,
      icon: Eye,
      color: "text-type-other",
      bgColor: "bg-type-other-bg",
    },
    {
      title: "重点关注",
      value: stats.focusedCount,
      icon: Star,
      color: "text-type-anime",
      bgColor: "bg-type-anime-bg",
    },
    {
      title: "已创建选题",
      value: stats.inProgressCount,
      icon: Zap,
      color: "text-type-vtuber",
      bgColor: "bg-type-vtuber-bg",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn(card.highlight && "border-amber-300")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={cn("p-2 rounded-lg", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
