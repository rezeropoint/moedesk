"use client"

/**
 * 季度行组件
 * 展示系列展开后的单个季度数据
 */

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { DataLevelBadge } from "./data-level-badge"
import { formatDate } from "@/lib/utils"
import type { SeasonEntry } from "@/types/trending"

interface SeasonEntryRowProps {
  entry: SeasonEntry
}

export function SeasonEntryRow({ entry }: SeasonEntryRowProps) {
  const formatHeatValue = (value: number | null) => {
    if (value === null) return "-"
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toString()
  }

  const getSeasonLabel = () => {
    if (entry.seasonLabel) return entry.seasonLabel
    if (entry.seasonNumber) return `第 ${entry.seasonNumber} 季`
    return null
  }

  const seasonLabel = getSeasonLabel()

  return (
    <div className="flex items-center gap-4 py-3 px-4 pl-16 border-t bg-muted/20 hover:bg-muted/40 transition-colors">
      {/* 封面（小尺寸） */}
      <div className="w-10 h-14 rounded bg-muted shrink-0 overflow-hidden relative">
        {entry.coverImage ? (
          <Image
            src={entry.coverImage}
            alt={entry.titleOriginal}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            📺
          </div>
        )}
      </div>

      {/* 季度信息 */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* 第一行：季度标签 + 标题 */}
        <div className="flex items-center gap-2">
          {seasonLabel && (
            <Badge variant="outline" className="text-xs shrink-0">
              {seasonLabel}
            </Badge>
          )}
          <span className="font-medium truncate text-sm">
            {entry.titleChinese || entry.titleOriginal}
          </span>
        </div>

        {/* 第二行：日期 + AniList 数据 */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(entry.releaseDate || entry.endDate) && (
            <span>
              {formatDate(entry.releaseDate)}
              {entry.releaseDate && entry.endDate && " - "}
              {formatDate(entry.endDate)}
            </span>
          )}
          <span className="border-l border-border pl-3">
            <DataLevelBadge level="season" />
          </span>
          <span className="text-brand-anilist">AniList</span>
          <span>
            综合{" "}
            <strong className="text-foreground">{entry.totalScore}</strong>
          </span>
          <span>
            热度{" "}
            <strong className="text-foreground">
              {formatHeatValue(entry.popularityScore)}
            </strong>
          </span>
          <span>
            评分{" "}
            <strong className="text-foreground">
              {formatHeatValue(entry.ratingScore)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  )
}
