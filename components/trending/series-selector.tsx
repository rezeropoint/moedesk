"use client"

/**
 * 系列选择器组件 - 用于审核时选择或创建系列
 */

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IpTypeBadge } from "./ip-type-badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IpType } from "@/types/trending"

interface SeriesOption {
  id: string
  titleOriginal: string
  titleChinese: string | null
  type: IpType
  coverImage: string | null
  totalSeasons: number
}

interface SeriesSelectorProps {
  value: string | null
  onChange: (seriesId: string | null) => void
  suggestedTitle?: string
  disabled?: boolean
}

export function SeriesSelector({
  value,
  onChange,
  suggestedTitle,
  disabled = false,
}: SeriesSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(suggestedTitle ?? "")
  const [results, setResults] = useState<SeriesOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SeriesOption | null>(null)

  // 搜索系列
  const searchSeries = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/series/search?q=${encodeURIComponent(query)}&limit=10`
      )
      if (response.ok) {
        const data = await response.json()
        setResults(data.data?.items || [])
      }
    } catch (error) {
      console.error("Failed to search series:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSeries(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchSeries])

  // 初始化时加载选中的系列
  useEffect(() => {
    if (value && !selected) {
      fetch(`/api/series/${value}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setSelected({
              id: data.data.id,
              titleOriginal: data.data.titleOriginal,
              titleChinese: data.data.titleChinese,
              type: data.data.type,
              coverImage: data.data.coverImage,
              totalSeasons: data.data.totalSeasons,
            })
          }
        })
        .catch(console.error)
    }
  }, [value, selected])

  // 选择系列
  const handleSelect = (series: SeriesOption) => {
    setSelected(series)
    onChange(series.id)
    setOpen(false)
    setSearch("")
  }

  // 清除选择
  const handleClear = () => {
    setSelected(null)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <Label>关联系列</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selected ? (
              <div className="flex items-center gap-2 truncate">
                <span className="truncate">{selected.titleOriginal}</span>
                <span className="text-muted-foreground text-xs">
                  ({selected.totalSeasons}季)
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                搜索或创建系列...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="输入系列名称搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                搜索中...
              </div>
            ) : results.length > 0 ? (
              <div className="p-1">
                {results.map((series) => (
                  <Button
                    key={series.id}
                    variant="ghost"
                    onClick={() => handleSelect(series)}
                    className={cn(
                      "w-full h-auto flex items-center gap-2 p-2 justify-start",
                      selected?.id === series.id && "bg-muted"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected?.id === series.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {series.titleOriginal}
                        </span>
                        <IpTypeBadge type={series.type} />
                      </div>
                      {series.titleChinese && (
                        <div className="text-xs text-muted-foreground truncate font-normal">
                          {series.titleChinese}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 font-normal">
                      {series.totalSeasons}季
                    </span>
                  </Button>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground text-sm mb-2">
                  未找到匹配的系列
                </p>
                <p className="text-xs text-muted-foreground">
                  审核通过时将自动创建新系列
                </p>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                输入至少 2 个字符开始搜索
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* 已选择时显示清除按钮 */}
      {selected && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">已选择:</span>
          <span className="font-medium">{selected.titleOriginal}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 未选择时提示 */}
      {!selected && (
        <p className="text-xs text-muted-foreground">
          不选择系列时，审核通过将自动创建同名系列
        </p>
      )}
    </div>
  )
}
