"use client"

/**
 * 单个热点项组件 - 支持展开/折叠的层级布局
 */

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IpTypeBadge } from "./ip-type-badge"
import { DataLevelBadge } from "./data-level-badge"
import { SeasonEntryRow } from "./season-entry-row"
import { SeriesEntriesManager } from "./series-entries-manager"
import { ExternalLink, Sparkles, Settings, ChevronRight, ChevronDown } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import type { TrendingListItem } from "@/types/trending"

interface TrendingItemProps {
  item: TrendingListItem
}

export function TrendingItem({ item }: TrendingItemProps) {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const isHot = item.rank <= 3
  const hasMultipleSeasons = item.entries.length > 1
  const hasEntries = item.entries.length > 0

  const handleViewDetail = () => {
    setDetailDialogOpen(true)
  }

  const handleGenerateContent = () => {
    // TODO: 触发 n8n 内容生成工作流
    console.log("Generate content for:", item.series.id)
  }

  const toggleExpand = () => {
    if (hasEntries) {
      setIsExpanded(!isExpanded)
    }
  }

  const formatHeatValue = (value: number | null) => {
    if (value === null) return "-"
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  return (
    <>
      <div className="border-b last:border-b-0">
        {/* 系列主行 */}
        <div className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
          {/* 展开/折叠按钮 */}
          <div className="w-6 shrink-0 flex items-center justify-center pt-1">
            {hasEntries ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={toggleExpand}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-4" />
            )}
          </div>

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

          {/* 封面 - 放大适应四行 */}
          <div className="w-16 h-[88px] rounded bg-muted shrink-0 overflow-hidden relative">
            {item.series.coverImage ? (
              <Image
                src={item.series.coverImage}
                alt={item.series.titleOriginal}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🎌
              </div>
            )}
          </div>

          {/* 内容区 - 四行布局 */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* 第一行：标题 */}
            <div className="flex items-center gap-2">
              <span
                className="font-semibold truncate cursor-pointer hover:text-primary"
                onClick={handleViewDetail}
              >
                {item.series.titleOriginal}
              </span>
              <IpTypeBadge type={item.series.type} />
              {hasMultipleSeasons && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {item.series.totalSeasons} 季
                </Badge>
              )}
            </div>

            {/* 第二行：中文标题 */}
            <div className="text-sm text-muted-foreground truncate">
              {item.series.titleChinese || "-"}
            </div>

            {/* 第三行：AniList 数据 + 日期 */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <DataLevelBadge level="series" />
              <span className="text-brand-anilist">AniList</span>
              <Badge variant="outline" className="shrink-0">
                综合: {item.heatData.anilistScore}
              </Badge>
              <span>热度 <strong className="text-foreground">{formatHeatValue(item.heatData.anilistPopularity)}</strong></span>
              <span>评分 <strong className="text-foreground">{formatHeatValue(item.heatData.anilistRating)}</strong></span>
              <span>共 <strong className="text-foreground">{item.series.totalSeasons}</strong> 季</span>
              {(item.series.releaseDate || item.series.endDate) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5 border-l border-border pl-3 cursor-help">
                      {item.series.endDate ? (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">已完结</Badge>
                      ) : item.series.releaseDate ? (
                        <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-600">放送中</Badge>
                      ) : null}
                      <span className="text-muted-foreground">
                        {formatDate(item.series.releaseDate)}{item.series.releaseDate && item.series.endDate && " - "}{formatDate(item.series.endDate)}
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {item.series.releaseDate ? "开播" : ""}{item.series.releaseDate && item.series.endDate ? " - " : ""}{item.series.endDate ? "完结" : ""}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* 第四行：社媒热度 */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <DataLevelBadge level="series" />
              <span><span className="text-orange-600">Reddit</span> <strong className="text-foreground">{formatHeatValue(item.heatData.redditKarma)}</strong></span>
              <span><span className="text-blue-400">Twitter/X</span> <strong className="text-foreground">{formatHeatValue(item.heatData.twitterMentions)}</strong></span>
              <span><span className="text-green-600">Google</span> <strong className="text-foreground">{formatHeatValue(item.heatData.googleTrend)}</strong></span>
              <span><span className="text-brand-bilibili">B站</span> <strong className="text-foreground">{formatHeatValue(item.heatData.biliDanmaku)}</strong></span>
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

        {/* 展开的季度列表 */}
        {isExpanded && hasEntries && (
          <div className="bg-muted/10">
            {item.entries.map((entry) => (
              <SeasonEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="truncate">{item.series.titleOriginal}</span>
              <IpTypeBadge type={item.series.type} />
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1 text-sm text-muted-foreground">
                {item.series.titleChinese && (
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">中文:</span>
                    <span className="text-foreground">{item.series.titleChinese}</span>
                  </div>
                )}
                {item.series.titleEnglish && (
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">英文:</span>
                    <span>{item.series.titleEnglish}</span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[120px_1fr] gap-4">
            {/* 封面 */}
            <div className="w-[120px] h-[160px] rounded-lg bg-muted overflow-hidden relative">
              {item.series.coverImage ? (
                <Image
                  src={item.series.coverImage}
                  alt={item.series.titleOriginal}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🎌
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="space-y-3">
              {/* 系列统计 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-primary">系列数据</span>
                  <DataLevelBadge level="series" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {item.series.aggregatedScore}
                    </div>
                    <div className="text-xs text-muted-foreground">综合分</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">
                      {item.series.totalSeasons}
                    </div>
                    <div className="text-xs text-muted-foreground">季数</div>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-1">
                {item.series.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* 日期 */}
              {(item.series.releaseDate || item.series.endDate) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {item.series.endDate ? (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">已完结</Badge>
                  ) : item.series.releaseDate ? (
                    <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-600">放送中</Badge>
                  ) : null}
                  {item.series.releaseDate && <span>开播: {formatDate(item.series.releaseDate)}</span>}
                  {item.series.endDate && <span>完结: {formatDate(item.series.endDate)}</span>}
                </div>
              )}

              {/* 简介 */}
              {item.series.description && (
                <div className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                  {item.series.description}
                </div>
              )}
            </div>
          </div>

          {/* AniList 数据 */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium text-brand-anilist">AniList</h4>
              <DataLevelBadge level="series" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {item.heatData.anilistScore}
                </div>
                <div className="text-xs text-muted-foreground">综合分</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatHeatValue(item.heatData.anilistPopularity)}
                </div>
                <div className="text-xs text-muted-foreground">热度</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatHeatValue(item.heatData.anilistRating)}
                </div>
                <div className="text-xs text-muted-foreground">评分</div>
              </div>
            </div>
          </div>

          {/* 社媒热度数据 */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium">社媒热度</h4>
              <DataLevelBadge level="series" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatHeatValue(item.heatData.redditKarma)}
                </div>
                <div className="text-xs text-orange-600">Reddit</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatHeatValue(item.heatData.twitterMentions)}
                </div>
                <div className="text-xs text-blue-400">Twitter/X</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatHeatValue(item.heatData.googleTrend)}
                </div>
                <div className="text-xs text-green-600">Google</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-foreground">
                  {formatHeatValue(item.heatData.biliDanmaku)}
                </div>
                <div className="text-xs text-brand-bilibili">B站</div>
              </div>
            </div>
          </div>

          {/* 季度列表 */}
          {item.entries.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-medium">季度数据</h4>
                <DataLevelBadge level="season" />
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {item.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="w-8 h-11 rounded bg-muted shrink-0 overflow-hidden relative">
                      {entry.coverImage ? (
                        <Image
                          src={entry.coverImage}
                          alt={entry.titleOriginal}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          📺
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.seasonLabel && (
                          <Badge variant="outline" className="text-xs">
                            {entry.seasonLabel}
                          </Badge>
                        )}
                        {entry.seasonNumber && !entry.seasonLabel && (
                          <Badge variant="outline" className="text-xs">
                            第 {entry.seasonNumber} 季
                          </Badge>
                        )}
                        <span className="text-sm truncate">
                          {entry.titleChinese || entry.titleOriginal}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>综合: {entry.totalScore}</span>
                        <span>热度: {formatHeatValue(entry.popularityScore)}</span>
                        <span>评分: {formatHeatValue(entry.ratingScore)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 管理条目 */}
          <div className="mt-4 pt-4 border-t flex justify-end">
            <SeriesEntriesManager
              seriesId={item.series.id}
              series={{
                id: item.series.id,
                titleOriginal: item.series.titleOriginal,
                titleChinese: item.series.titleChinese,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  管理条目
                </Button>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
