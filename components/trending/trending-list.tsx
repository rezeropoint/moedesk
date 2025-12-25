"use client"

/**
 * 热点列表组件
 */

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { TrendingItem } from "./trending-item"
import { RefreshCw } from "lucide-react"
import type { TrendingListItem, IpType, TrendingStatus } from "@/types/trending"

interface TrendingListProps {
  initialData: TrendingListItem[]
}

type SourceFilter = "ALL" | "REDDIT" | "TWITTER" | "TIKTOK" | "ANILIST"

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "REDDIT", label: "Reddit" },
  { value: "TWITTER", label: "Twitter" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "ANILIST", label: "AniList" },
]

export function TrendingList({ initialData }: TrendingListProps) {
  const [items, setItems] = useState(initialData)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL")
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const response = await fetch(`/api/trendings?source=${sourceFilter}`)
      if (response.ok) {
        const result = await response.json()
        setItems(result.data.items)
      }
    })
  }

  const handleSourceFilter = (source: SourceFilter) => {
    setSourceFilter(source)
    startTransition(async () => {
      const response = await fetch(`/api/trendings?source=${source}`)
      if (response.ok) {
        const result = await response.json()
        setItems(result.data.items)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* 来源筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {SOURCE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={sourceFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceFilter(filter.value)}
              disabled={isPending}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
          />
          刷新
        </Button>
      </div>

      {/* 列表 */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            暂无热点数据
          </div>
        ) : (
          items.map((item) => (
            <TrendingItem
              key={item.id}
              item={{
                id: item.id,
                rank: item.rank,
                ip: {
                  id: item.ip.id,
                  type: item.ip.type as IpType,
                  titleOriginal: item.ip.titleOriginal,
                  titleChinese: item.ip.titleChinese,
                  coverImage: item.ip.coverImage,
                  tags: item.ip.tags,
                },
                totalScore: item.totalScore,
                heatLevel: item.heatLevel,
                sources: item.sources,
                discussionCount: item.discussionCount,
                lastUpdated: item.lastUpdated,
                status: item.status as TrendingStatus,
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
