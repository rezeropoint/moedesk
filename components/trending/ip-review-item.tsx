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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IpTypeBadge } from "./ip-type-badge"
import { Check, X, Loader2, Pencil } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { IpType, ReviewStatus } from "@/types/trending"

interface IpReviewItemProps {
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

export function IpReviewItem({
  item,
  onApproved,
  onRejected,
}: IpReviewItemProps) {
  const router = useRouter()
  const [isApproving, startApprove] = useTransition()
  const [isRejecting, startReject] = useTransition()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.titleChinese ?? "")
  const [isSaving, startSave] = useTransition()


  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("zh-CN")
  }

  const handleApprove = () => {
    startApprove(async () => {
      const response = await fetch(`/api/ip-reviews/${item.id}/approve`, {
        method: "POST",
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
      const response = await fetch(`/api/ip-reviews/${item.id}/reject`, {
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
      const response = await fetch(`/api/ip-reviews/${item.id}`, {
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
            {item.releaseDate && (
              <span className="text-muted-foreground">
                开播 {formatDate(item.releaseDate)}
              </span>
            )}
            {item.endDate && (
              <span className="text-muted-foreground">
                完结 {formatDate(item.endDate)}
              </span>
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
            variant="ghost"
            size="sm"
            onClick={() => setDetailDialogOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            修改
          </Button>
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
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            通过
          </Button>
        </div>
      </div>

      {/* 详情弹窗 */}
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
              <span className="truncate">{item.titleOriginal}</span>
              <IpTypeBadge type={item.type} />
            </DialogTitle>
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
              <div className="text-sm text-muted-foreground">
                <span>发布日期: {formatDate(item.releaseDate)}</span>
                <span className="mx-2">|</span>
                <span>入库时间: {formatDate(item.createdAt)}</span>
              </div>

              {/* 简介 */}
              {item.description && (
                <div className="text-sm text-muted-foreground max-h-[100px] overflow-y-auto">
                  {item.description}
                </div>
              )}
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
