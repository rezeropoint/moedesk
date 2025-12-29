"use client"

import { TrendingUp, Flame, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { AnalyticsMetrics } from "@/types/analytics"

interface MetricsCardsProps {
  metrics: AnalyticsMetrics | null
  loading?: boolean
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">暂无数据</div>
        </CardContent>
      </Card>
    )
  }

  const items = [
    {
      icon: TrendingUp,
      label: "平均变化率",
      value: `${metrics.averageChangeRate > 0 ? "+" : ""}${metrics.averageChangeRate.toFixed(1)}%`,
      color: metrics.averageChangeRate >= 0 ? "text-primary" : "text-destructive",
    },
    {
      icon: Flame,
      label: "最热 IP",
      value: metrics.topIpTitle || "-",
      color: "text-primary",
    },
    {
      icon: Activity,
      label: "数据源覆盖",
      value: `${Math.round(metrics.sourceCoverage * 100)}%`,
      color: "text-primary",
    },
  ]

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium text-sm">关键指标</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
