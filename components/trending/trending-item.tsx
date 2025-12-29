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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IpTypeBadge } from "./ip-type-badge"
import { ExternalLink, Sparkles } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
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
    console.log("Generate content for:", item.ip.id)
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
          {item.ip.coverImage ? (
            <Image
              src={item.ip.coverImage}
              alt={item.ip.titleOriginal}
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
                {item.ip.titleOriginal}
              </span>
              <IpTypeBadge type={item.ip.type} />
            </div>
            {item.ip.titleChinese && (
              <div className="text-sm text-muted-foreground truncate">
                {item.ip.titleChinese}
              </div>
            )}
          </div>

          {/* AniList 评分 + 社媒热度 + 日期 */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="text-blue-600">AniList</span>
            <span>综合 <strong className="text-foreground">{item.ip.totalScore}</strong></span>
            <span>热度 <strong className="text-foreground">{item.ip.popularityScore ?? "-"}</strong></span>
            <span>评分 <strong className="text-foreground">{item.ip.ratingScore ?? "-"}</strong></span>
            {(item.ip.releaseDate || item.ip.endDate) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="border-l border-border pl-3 cursor-help flex items-center gap-1.5">
                    {item.ip.endDate ? (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">已完结</Badge>
                    ) : item.ip.releaseDate ? (
                      <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-600">放送中</Badge>
                    ) : null}
                    <strong className="text-foreground">
                      {formatDate(item.ip.releaseDate)}{item.ip.releaseDate && item.ip.endDate && " - "}{formatDate(item.ip.endDate)}
                    </strong>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {item.ip.releaseDate ? "开播" : ""}{item.ip.releaseDate && item.ip.endDate ? " - " : ""}{item.ip.endDate ? "完结" : ""}
                </TooltipContent>
              </Tooltip>
            )}
            <span className="border-l border-border pl-3"><span className="text-orange-600">Reddit</span> <strong className="text-foreground">{formatHeatValue(item.heatData.redditKarma)}</strong></span>
            <span><span className="text-blue-400">Twitter/X</span> <strong className="text-foreground">{formatHeatValue(item.heatData.twitterMentions)}</strong></span>
            <span><span className="text-green-600">Google</span> <strong className="text-foreground">{formatHeatValue(item.heatData.googleTrend)}</strong></span>
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
              <span className="truncate">{item.ip.titleOriginal}</span>
              <IpTypeBadge type={item.ip.type} />
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {item.ip.titleChinese && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">中文:</span>
                  <span className="text-foreground">{item.ip.titleChinese}</span>
                </div>
              )}
              {item.ip.titleEnglish && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">英文:</span>
                  <span>{item.ip.titleEnglish}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[120px_1fr] gap-4">
            {/* 封面 */}
            <div className="w-[120px] h-[160px] rounded-lg bg-muted overflow-hidden relative">
              {item.ip.coverImage ? (
                <Image
                  src={item.ip.coverImage}
                  alt={item.ip.titleOriginal}
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
              {/* AniList 评分详情 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600">AniList 数据</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {item.ip.totalScore}
                    </div>
                    <div className="text-xs text-muted-foreground">综合分</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">
                      {item.ip.popularityScore ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">热度分</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">
                      {item.ip.ratingScore ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">评分</div>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-1">
                {item.ip.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* 日期 */}
              <div className="text-sm text-muted-foreground">
                {item.ip.releaseDate && <span>开播: {formatDate(item.ip.releaseDate)}</span>}
                {item.ip.endDate && <span className="ml-4">完结: {formatDate(item.ip.endDate)}</span>}
                {!item.ip.releaseDate && !item.ip.endDate && <span>日期: -</span>}
              </div>

              {/* 简介 */}
              {item.ip.description && (
                <div className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                  {item.ip.description}
                </div>
              )}
            </div>
          </div>

          {/* 社媒热度数据 */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">社媒热度</h4>
            <div className="grid grid-cols-3 gap-2">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
