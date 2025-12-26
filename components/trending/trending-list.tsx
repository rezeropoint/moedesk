"use client"

/**
 * 热点列表组件
 */

import { TrendingItem } from "./trending-item"
import type { TrendingListItem } from "@/types/trending"

interface TrendingListProps {
  data: TrendingListItem[]
}

export function TrendingList({ data }: TrendingListProps) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {data.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          暂无热点数据
        </div>
      ) : (
        data.map((item) => (
          <TrendingItem key={item.id} item={item} />
        ))
      )}
    </div>
  )
}
