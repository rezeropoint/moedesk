"use client"

/**
 * 待审核 IP 列表组件
 */

import { useState, useTransition } from "react"
import { EntryItem } from "./entry-item"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { IpType, ReviewStatus } from "@/types/trending"

interface EntryListItem {
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

interface EntryListProps {
  initialData: EntryListItem[]
}

export function EntryList({ initialData }: EntryListProps) {
  const [items, setItems] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const response = await fetch("/api/entries?status=PENDING")
      if (response.ok) {
        const result = await response.json()
        setItems(result.data.items)
      }
    })
  }

  const handleApproved = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleRejected = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {items.length} 条待审核记录
        </p>
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

      <div className="bg-card rounded-xl border overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            暂无待审核记录
          </div>
        ) : (
          items.map((item) => (
            <EntryItem
              key={item.id}
              item={item}
              onApproved={() => handleApproved(item.id)}
              onRejected={() => handleRejected(item.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
