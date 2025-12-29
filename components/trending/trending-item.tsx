"use client"

/**
 * 单个热点项组件 - 双行紧凑布局
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
import { IpTypeBadge } from "./ip-type-badge"
import { ExternalLink, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrendingListItem } from "@/types/trending"

interface TrendingItemProps {
  item: TrendingListItem
}

export function TrendingItem({ item }: TrendingItemProps) {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const isHot = item.rank <= 3

  const handleViewDetail = () => {
    setDetailDialogOpen(true)
  }

  const handleGenerateContent = () => {
    // TODO: 触发 n8n 内容生成工作流
    console.log("Generate content for:", item.series.id)
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
      <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
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

        {/* 封面 */}
        <div className="w-10 h-14 rounded bg-muted shrink-0 overflow-hidden relative">
          {item.series.coverImage ? (
            <Image
              src={item.series.coverImage}
              alt={item.series.titleOriginal}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              🎌
            </div>
          )}
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {/* 标题区域 */}
          <div className="mb-1">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold truncate cursor-pointer hover:text-primary"
                onClick={handleViewDetail}
              >
                {item.series.titleOriginal}
              </span>
              <IpTypeBadge type={item.series.type} />
            </div>
            {item.series.titleChinese && (
              <div className="text-sm text-muted-foreground truncate">
                {item.series.titleChinese}
              </div>
            )}
          </div>

          {/* 系列信息 + 社媒热度 */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="text-brand-anilist">AniList</span>
            <span><strong className="text-foreground">{item.heatData.anilistScore}</strong>分</span>
            <span>热度 <strong className="text-foreground">{formatHeatValue(item.heatData.anilistPopularity)}</strong></span>
            <span>评分 <strong className="text-foreground">{formatHeatValue(item.heatData.anilistRating)}</strong></span>
            <span>共 <strong className="text-foreground">{item.series.totalSeasons}</strong> 季</span>
            <span className="border-l border-border pl-3"><span className="text-orange-600">Reddit</span> <strong className="text-foreground">{formatHeatValue(item.heatData.redditKarma)}</strong></span>
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

      {/* 详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="truncate">{item.series.titleOriginal}</span>
              <IpTypeBadge type={item.series.type} />
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {item.series.titleChinese && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">中文:</span>
                  <span className="text-foreground">{item.series.titleChinese}</span>
                </div>
              )}
              {item.series.titleEnglish && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">英文:</span>
                  <span>{item.series.titleEnglish}</span>
                </div>
              )}
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
            <h4 className="text-sm font-medium mb-3 text-brand-anilist">AniList</h4>
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
            <h4 className="text-sm font-medium mb-3">社媒热度</h4>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
