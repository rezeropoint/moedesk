"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import type { PublishStats } from "@/types/publish"

interface PublishStatsCardsProps {
  stats: PublishStats
}

const statConfigs = [
  {
    key: "draft" as const,
    label: "草稿",
    icon: FileText,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  {
    key: "scheduled" as const,
    label: "已排期",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "publishedToday" as const,
    label: "今日已发布",
    icon: CheckCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    key: "failed" as const,
    label: "发布失败",
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
]

export function PublishStatsCards({ stats }: PublishStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((config) => {
        const Icon = config.icon
        const value = stats[config.key]

        return (
          <Card key={config.key}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-2 ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{config.label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
