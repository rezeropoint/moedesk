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
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "追踪中",
      value: stats.totalTrendings,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "待审核",
      value: stats.pendingReviews,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      highlight: stats.pendingReviews > 0,
    },
    {
      title: "观望中",
      value: stats.watchingCount,
      icon: Eye,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      title: "重点关注",
      value: stats.focusedCount,
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "已创建选题",
      value: stats.inProgressCount,
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
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
