/**
 * 工作流统计概览卡片
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  TrendingUp,
} from "lucide-react"
import type { WorkflowStats } from "@/types/workflow"

interface WorkflowStatsCardsProps {
  stats: WorkflowStats
}

export function WorkflowStatsCards({ stats }: WorkflowStatsCardsProps) {
  const cards = [
    {
      title: "活跃工作流",
      value: stats.active,
      total: stats.total,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "停用工作流",
      value: stats.inactive,
      total: stats.total,
      icon: PlayCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      title: "错误状态",
      value: stats.error,
      total: stats.total,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "今日执行",
      value: stats.todayExecutions,
      description: "次",
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "成功率",
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: stats.successRate >= 90 ? "text-green-600" : "text-amber-600",
      bgColor: stats.successRate >= 90 ? "bg-green-100" : "bg-amber-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value}
              {card.total !== undefined && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{card.total}
                </span>
              )}
              {card.description && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {card.description}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
