"use client"

/**
 * 单个热点项组件
 */

import { Button } from "@/components/ui/button"
import { IpTypeBadge } from "./ip-type-badge"
import { ExternalLink, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { TrendingStatus, IpType } from "@/types/trending"

interface TrendingItemProps {
  item: {
    id: string
    rank: number
    ip: {
      id: string
      type: IpType
      titleOriginal: string
      titleChinese: string | null
      coverImage: string | null
      tags: string[]
    }
    totalScore: number
    heatLevel: 1 | 2 | 3
    sources: string[]
    discussionCount: number
    lastUpdated: string
    status: TrendingStatus
  }
}

export function TrendingItem({ item }: TrendingItemProps) {
  const isHot = item.rank <= 3
  const title = item.ip.titleChinese || item.ip.titleOriginal

  const handleViewDetail = () => {
    // TODO: 打开详情弹窗或跳转
    console.log("View detail:", item.id)
  }

  const handleGenerateContent = () => {
    // TODO: 触发 n8n 内容生成工作流
    console.log("Generate content for:", item.ip.id)
  }

  const formatDiscussionCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      {/* 排名 */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
          isHot
            ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800"
            : "bg-muted text-muted-foreground"
        )}
      >
        {item.rank}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold truncate">{title}</span>
          {/* 火热程度 */}
          {item.heatLevel >= 1 && (
            <span className="text-orange-500 shrink-0">
              {"🔥".repeat(item.heatLevel)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <IpTypeBadge type={item.ip.type} />
          <span className="flex items-center gap-1">
            📍 {item.sources.join(" / ") || "Unknown"}
          </span>
          <span>💬 {formatDiscussionCount(item.discussionCount)}</span>
          <span>
            ⏰{" "}
            {formatDistanceToNow(new Date(item.lastUpdated), {
              locale: zhCN,
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={handleViewDetail}>
          <ExternalLink className="h-4 w-4 mr-1" />
          详情
        </Button>
        <Button size="sm" onClick={handleGenerateContent}>
          <Sparkles className="h-4 w-4 mr-1" />
          生成内容
        </Button>
      </div>
    </div>
  )
}
