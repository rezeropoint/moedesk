"use client"

/**
 * 单个待审核项组件
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IpTypeBadge } from "./ip-type-badge"
import { SeriesSelector } from "./series-selector"
import { Check, X, Loader2, Pencil, ClipboardCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { IpType, ReviewStatus } from "@/types/trending"
import { formatDate } from "@/lib/utils"

interface EntryItemProps {
  item: {
    id: string
    type: IpType
    titleOriginal: string
    titleChinese: string | null
    titleEnglish: string | null
    description: string | null
    coverImage: string | null
    tags: string[]
    releaseDate: string | null
    endDate: string | null
    popularityScore: number | null
    ratingScore: number | null
    totalScore: number
    status: ReviewStatus
    createdAt: string
  }
  onApproved: () => void
  onRejected: () => void
}

export function EntryItem({
  item,
  onApproved,
  onRejected,
}: EntryItemProps) {
  const router = useRouter()
  const [isApproving, startApprove] = useTransition()
  const [isRejecting, startReject] = useTransition()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.titleChinese ?? "")
  const [isSaving, startSave] = useTransition()
  // 系列关联状态
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [seasonNumber, setSeasonNumber] = useState<string>("")
  const [seasonLabel, setSeasonLabel] = useState("")


  const handleApprove = () => {
    startApprove(async () => {
      const body: Record<string, unknown> = {
        createNewSeries: !selectedSeriesId,
      }
      if (selectedSeriesId) {
        body.seriesId = selectedSeriesId
      }
      if (seasonNumber) {
        body.seasonNumber = parseInt(seasonNumber, 10)
      }
      if (seasonLabel.trim()) {
        body.seasonLabel = seasonLabel.trim()
      }

      const response = await fetch(`/api/entries/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        onApproved()
        router.refresh() // 刷新页面数据，更新热点列表
      }
    })
  }

  const handleReject = () => {
    if (!rejectNote.trim()) return

    startReject(async () => {
      const response = await fetch(`/api/entries/${item.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: rejectNote }),
      })
      if (response.ok) {
        setRejectDialogOpen(false)
        onRejected()
      }
    })
  }

  const handleSaveTitle = () => {
    if (!editValue.trim()) return

    startSave(async () => {
      const response = await fetch(`/api/entries/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleChinese: editValue.trim() }),
      })
      if (response.ok) {
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  const handleCancelEdit = () => {
    setEditValue(item.titleChinese ?? "")
    setIsEditing(false)
  }

  return (
    <>
      <div className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        {/* 封面 */}
        <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden relative">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={item.titleOriginal}
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

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {/* 标题区域 */}
          <div className="mb-1">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold truncate cursor-pointer hover:text-primary"
                onClick={() => setDetailDialogOpen(true)}
              >
                {item.titleOriginal}
              </span>
              <IpTypeBadge type={item.type} />
            </div>
            {item.titleChinese && (
              <div className="text-sm text-muted-foreground truncate">
                {item.titleChinese}
              </div>
            )}
          </div>
          {/* 评分信息 */}
          <div className="flex items-center gap-3 text-sm mb-1">
            <Badge variant="outline" className="shrink-0">
              综合: {item.totalScore}
            </Badge>
            <span className="text-muted-foreground">
              热度: {item.popularityScore ?? "-"}
            </span>
            <span className="text-muted-foreground">
              评分: {item.ratingScore ?? "-"}
            </span>
            {(item.releaseDate || item.endDate) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1.5 cursor-help">
                    {item.endDate ? (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">已完结</Badge>
                    ) : item.releaseDate ? (
                      <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-600">放送中</Badge>
                    ) : null}
                    <span className="text-muted-foreground">
                      {formatDate(item.releaseDate)}{item.releaseDate && item.endDate && " - "}{formatDate(item.endDate)}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {item.releaseDate ? "开播" : ""}{item.releaseDate && item.endDate ? " - " : ""}{item.endDate ? "完结" : ""}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {/* 标签和时间 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            {item.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <span className="text-xs">
              ⏰{" "}
              {formatDistanceToNow(new Date(item.createdAt), {
                locale: zhCN,
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isApproving || isRejecting}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-1" />
            )}
            拒绝
          </Button>
          <Button
            size="sm"
            onClick={() => setDetailDialogOpen(true)}
            disabled={isApproving || isRejecting}
          >
            <ClipboardCheck className="h-4 w-4 mr-1" />
            审批
          </Button>
        </div>
      </div>

      {/* 审批弹窗 */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open)
          if (!open) {
            setIsEditing(false)
            setEditValue(item.titleChinese ?? "")
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              审批 IP
              <IpTypeBadge type={item.type} />
            </DialogTitle>
            <div className="text-lg font-semibold pt-1">{item.titleOriginal}</div>
            <DialogDescription className="space-y-1">
              {/* 中文标题（可编辑） */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0">中文:</span>
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="输入中文标题"
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle()
                        if (e.key === "Escape") handleCancelEdit()
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={handleSaveTitle}
                      disabled={!editValue.trim() || isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className={item.titleChinese ? "text-foreground" : "text-muted-foreground italic"}>
                      {item.titleChinese || "未设置"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => setIsEditing(true)}
                      title="编辑中文标题"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {/* 英文标题 */}
              {item.titleEnglish && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">英文:</span>
                  <span>{item.titleEnglish}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[120px_1fr] gap-4">
            {/* 封面 */}
            <div className="w-[120px] h-[160px] rounded-lg bg-muted overflow-hidden relative">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.titleOriginal}
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
              {/* 评分详情 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {item.totalScore}
                  </div>
                  <div className="text-xs text-muted-foreground">综合分</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {item.popularityScore ?? "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">热度分</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {item.ratingScore ?? "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">评分</div>
                </div>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* 日期 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {item.endDate ? (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">已完结</Badge>
                ) : item.releaseDate ? (
                  <Badge variant="default" className="text-xs px-1.5 py-0 bg-green-600">放送中</Badge>
                ) : null}
                {item.releaseDate && <span>开播: {formatDate(item.releaseDate)}</span>}
                {item.endDate && <span>完结: {formatDate(item.endDate)}</span>}
                <span>|</span>
                <span>入库: {formatDate(item.createdAt)}</span>
              </div>

              {/* 简介 */}
              {item.description && (
                <div className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                  {item.description}
                </div>
              )}
            </div>
          </div>

          {/* 系列关联 */}
          <div className="mt-4 pt-4 border-t space-y-4">
            <SeriesSelector
              value={selectedSeriesId}
              onChange={setSelectedSeriesId}
              suggestedTitle={item.titleOriginal}
            />

            {/* 季度信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="season-number">季度编号</Label>
                <Input
                  id="season-number"
                  type="number"
                  min="1"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(e.target.value)}
                  placeholder="如: 1, 2, 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="season-label">季度标签</Label>
                <Input
                  id="season-label"
                  value={seasonLabel}
                  onChange={(e) => setSeasonLabel(e.target.value)}
                  placeholder="如: S1, 剧场版, OVA"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDetailDialogOpen(false)
                setRejectDialogOpen(true)
              }}
            >
              <X className="h-4 w-4 mr-1" />
              拒绝
            </Button>
            <Button
              onClick={() => {
                setDetailDialogOpen(false)
                handleApprove()
              }}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝原因弹窗 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝 IP 入库</DialogTitle>
            <DialogDescription>
              请填写拒绝原因，该原因将被记录
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-note">拒绝原因</Label>
            <Input
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectNote.trim() || isRejecting}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
