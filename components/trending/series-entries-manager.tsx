"use client"

/**
 * 系列条目管理器 - 显示系列下所有 Entry，支持编辑和撤销
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SeriesSelector } from "./series-selector"
import { Loader2, RotateCcw, Settings, List, Pencil, ChevronUp, AlertTriangle } from "lucide-react"

interface Entry {
  id: string
  titleOriginal: string
  titleChinese: string | null
  seasonNumber: number | null
  seasonLabel: string | null
  totalScore: number
  status: string
}

interface Series {
  id: string
  titleOriginal: string
  titleChinese: string | null
}

interface SeriesEntriesManagerProps {
  seriesId: string
  series: Series
  trigger: React.ReactNode
  onUpdated?: () => void
}

export function SeriesEntriesManager({
  seriesId,
  series,
  trigger,
  onUpdated,
}: SeriesEntriesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 系列编辑状态
  const [isEditingSeries, setIsEditingSeries] = useState(false)
  const [seriesTitleOriginal, setSeriesTitleOriginal] = useState("")
  const [seriesTitleChinese, setSeriesTitleChinese] = useState("")
  const [isSavingSeries, startSavingSeries] = useTransition()

  // 条目内联编辑状态（替代二级弹窗）
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [expandMode, setExpandMode] = useState<"edit" | "revoke" | null>(null)

  // 条目编辑表单状态
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [seasonNumber, setSeasonNumber] = useState("")
  const [seasonLabel, setSeasonLabel] = useState("")
  const [isSaving, startSave] = useTransition()

  // 撤销状态
  const [isRevoking, startRevoke] = useTransition()

  // 获取系列下的 Entry
  const fetchEntries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/series/${seriesId}`)
      if (response.ok) {
        const { data } = await response.json()
        setEntries(data.entries || [])
      }
    } catch (e) {
      console.error("Failed to fetch entries:", e)
    } finally {
      setIsLoading(false)
    }
  }

  // 打开弹窗时获取数据
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchEntries()
      setIsEditingSeries(false)
      setExpandedEntryId(null)
      setExpandMode(null)
    }
  }

  // 保存系列名称
  const handleSaveSeries = () => {
    if (!seriesTitleOriginal.trim()) {
      alert("原名不能为空")
      return
    }

    startSavingSeries(async () => {
      const response = await fetch(`/api/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleOriginal: seriesTitleOriginal.trim(),
          titleChinese: seriesTitleChinese.trim() || null,
        }),
      })

      if (response.ok) {
        setIsEditingSeries(false)
        onUpdated?.()
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "保存失败")
      }
    })
  }

  // 开始编辑条目（内联展开）
  const handleStartEdit = (entry: Entry) => {
    setExpandedEntryId(entry.id)
    setExpandMode("edit")
    setSelectedSeriesId(seriesId)
    setSeasonNumber(entry.seasonNumber?.toString() || "")
    setSeasonLabel(entry.seasonLabel || "")
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setExpandedEntryId(null)
    setExpandMode(null)
  }

  // 保存编辑
  const handleSave = () => {
    if (!expandedEntryId) return

    startSave(async () => {
      const response = await fetch(`/api/entries/${expandedEntryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId: selectedSeriesId,
          seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : null,
          seasonLabel: seasonLabel || null,
        }),
      })

      if (response.ok) {
        setExpandedEntryId(null)
        setExpandMode(null)
        fetchEntries()
        onUpdated?.()
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "保存失败")
      }
    })
  }

  // 开始撤销确认（内联展开）
  const handleStartRevoke = (entry: Entry) => {
    setExpandedEntryId(entry.id)
    setExpandMode("revoke")
  }

  // 取消撤销
  const handleCancelRevoke = () => {
    setExpandedEntryId(null)
    setExpandMode(null)
  }

  // 确认撤销
  const handleRevoke = () => {
    if (!expandedEntryId) return

    startRevoke(async () => {
      const response = await fetch(`/api/entries/${expandedEntryId}/revoke`, {
        method: "POST",
      })

      if (response.ok) {
        setExpandedEntryId(null)
        setExpandMode(null)
        fetchEntries()
        onUpdated?.()
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "撤销失败")
      }
    })
  }

  return (
    <>
      <div onClick={() => handleOpenChange(true)}>{trigger}</div>

      {/* 条目列表弹窗 */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              管理条目
            </DialogTitle>
          </DialogHeader>

          {/* 系列信息区 - 可编辑 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">系列</Badge>
              <span className="text-xs text-muted-foreground">所有季度/剧场版共用的名称</span>
            </div>
            <div className="border rounded-lg p-4 bg-muted/30">
              {isEditingSeries ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>原名 (必填)</Label>
                    <Input
                      value={seriesTitleOriginal}
                      onChange={(e) => setSeriesTitleOriginal(e.target.value)}
                      placeholder="如: Demon Slayer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>中文名</Label>
                    <Input
                      value={seriesTitleChinese}
                      onChange={(e) => setSeriesTitleChinese(e.target.value)}
                      placeholder="如: 鬼灭之刃"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingSeries(false)}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSeries}
                      disabled={isSavingSeries}
                    >
                      {isSavingSeries && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {series.titleChinese || series.titleOriginal}
                    </div>
                    {series.titleChinese && (
                      <div className="text-sm text-muted-foreground">
                        {series.titleOriginal}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSeriesTitleOriginal(series.titleOriginal)
                      setSeriesTitleChinese(series.titleChinese || "")
                      setIsEditingSeries(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 条目列表 - 内联编辑 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">条目</Badge>
              <span className="text-xs text-muted-foreground">该系列下的各季/剧场版</span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无条目
              </div>
            ) : (
              entries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id
                const currentMode = isExpanded ? expandMode : null

                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border bg-card overflow-hidden"
                  >
                    {/* 卡片主体 */}
                    <div className="flex items-center justify-between p-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {entry.titleChinese || entry.titleOriginal}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {entry.seasonLabel && (
                            <Badge variant="outline" className="text-xs">
                              {entry.seasonLabel}
                            </Badge>
                          )}
                          {entry.seasonNumber && (
                            <span>第 {entry.seasonNumber} 季</span>
                          )}
                          <span>综合分: {entry.totalScore}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isExpanded && currentMode === "edit" ? (
                          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(entry)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleStartRevoke(entry)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 展开区域 - 编辑表单 */}
                    {isExpanded && currentMode === "edit" && (
                      <div className="border-t p-4 bg-muted/30 space-y-4">
                        <SeriesSelector
                          value={selectedSeriesId}
                          onChange={setSelectedSeriesId}
                          suggestedTitle={entry.titleOriginal}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>季度编号</Label>
                            <Input
                              type="number"
                              min="1"
                              value={seasonNumber}
                              onChange={(e) => setSeasonNumber(e.target.value)}
                              placeholder="如: 1, 2, 3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>季度标签</Label>
                            <Input
                              value={seasonLabel}
                              onChange={(e) => setSeasonLabel(e.target.value)}
                              placeholder="如: S1, 剧场版"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                            取消
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            保存
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 展开区域 - 撤销确认 */}
                    {isExpanded && currentMode === "revoke" && (
                      <div className="border-t p-4 bg-destructive/5 space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-destructive">确认撤销审核？</div>
                            <div className="text-sm text-muted-foreground">
                              撤销后，该条目将恢复为「待审核」状态，从当前系列中移除。
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelRevoke}>
                            取消
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRevoke}
                            disabled={isRevoking}
                          >
                            {isRevoking && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            确认撤销
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
