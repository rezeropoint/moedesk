"use client"

/**
 * 热点雷达 Tab 切换组件
 */

import { useState, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { TrendingList } from "./trending-list"
import { IpReviewList } from "./ip-review-list"
import { RefreshCw } from "lucide-react"
import type { TrendingListItem, IpType, ReviewStatus } from "@/types/trending"

interface IpReviewListItem {
  id: string
  type: IpType
  titleOriginal: string
  titleChinese: string | null
  titleEnglish: string | null
  description: string | null
  coverImage: string | null
  tags: string[]
  releaseDate: string | null
  popularityScore: number | null
  ratingScore: number | null
  totalScore: number
  status: ReviewStatus
  createdAt: string
}

interface TrendingTabsProps {
  initialTrendings: TrendingListItem[]
  initialPendingReviews: IpReviewListItem[]
  pendingCount: number
}

export function TrendingTabs({
  initialTrendings,
  initialPendingReviews,
  pendingCount,
}: TrendingTabsProps) {
  const [activeTab, setActiveTab] = useState<"trending" | "review">("trending")
  const [trendingItems, setTrendingItems] = useState(initialTrendings)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const response = await fetch("/api/trendings")
      if (response.ok) {
        const result = await response.json()
        setTrendingItems(result.data.items)
      }
    })
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "trending" | "review")}
    >
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="trending">
            实时热点 ({trendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="relative">
            待审核
            {pendingCount > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {activeTab === "trending" && (
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
        )}
      </div>

      <TabsContent value="trending" className="m-0">
        <TrendingList data={trendingItems} />
      </TabsContent>

      <TabsContent value="review" className="m-0">
        <IpReviewList initialData={initialPendingReviews} />
      </TabsContent>
    </Tabs>
  )
}
