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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SeriesSelector } from "./series-selector"
import { Loader2, RotateCcw, Settings, List } from "lucide-react"

interface Entry {
  id: string
  titleOriginal: string
  titleChinese: string | null
  seasonNumber: number | null
  seasonLabel: string | null
  totalScore: number
  status: string
}

interface SeriesEntriesManagerProps {
  seriesId: string
  seriesTitle: string
  trigger: React.ReactNode
  onUpdated?: () => void
}

export function SeriesEntriesManager({
  seriesId,
  seriesTitle,
  trigger,
  onUpdated,
}: SeriesEntriesManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 编辑状态
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [seasonNumber, setSeasonNumber] = useState("")
  const [seasonLabel, setSeasonLabel] = useState("")
  const [isSaving, startSave] = useTransition()

  // 撤销状态
  const [revokingEntry, setRevokingEntry] = useState<Entry | null>(null)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
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
    }
  }

  // 打开编辑弹窗
  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setSelectedSeriesId(seriesId)
    setSeasonNumber(entry.seasonNumber?.toString() || "")
    setSeasonLabel(entry.seasonLabel || "")
    setEditDialogOpen(true)
  }

  // 保存编辑
  const handleSave = () => {
    if (!editingEntry) return

    startSave(async () => {
      const response = await fetch(`/api/entries/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId: selectedSeriesId,
          seasonNumber: seasonNumber ? parseInt(seasonNumber, 10) : null,
          seasonLabel: seasonLabel || null,
        }),
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setEditingEntry(null)
        fetchEntries()
        onUpdated?.()
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "保存失败")
      }
    })
  }

  // 打开撤销确认
  const handleRevokeClick = (entry: Entry) => {
    setRevokingEntry(entry)
    setRevokeDialogOpen(true)
  }

  // 确认撤销
  const handleRevoke = () => {
    if (!revokingEntry) return

    startRevoke(async () => {
      const response = await fetch(`/api/entries/${revokingEntry.id}/revoke`, {
        method: "POST",
      })

      if (response.ok) {
        setRevokeDialogOpen(false)
        setRevokingEntry(null)
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
            <DialogDescription>{seriesTitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无条目
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRevokeClick(entry)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑条目</DialogTitle>
            <DialogDescription>
              {editingEntry?.titleChinese || editingEntry?.titleOriginal}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SeriesSelector
              value={selectedSeriesId}
              onChange={setSelectedSeriesId}
              suggestedTitle={editingEntry?.titleOriginal || ""}
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
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 撤销确认 */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认撤销审核？</AlertDialogTitle>
            <AlertDialogDescription>
              撤销后，该条目将恢复为「待审核」状态，从当前系列中移除。
              {revokingEntry && (
                <span className="block mt-2 font-medium">
                  {revokingEntry.titleChinese || revokingEntry.titleOriginal}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRevoking && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              确认撤销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
