"use client"

/**
 * 热点雷达 Tab 切换组件
 */

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingList } from "./trending-list"
import { IpReviewList } from "./ip-review-list"
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

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "trending" | "review")}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="trending">
          实时热点 ({initialTrendings.length})
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

      <TabsContent value="trending" className="m-0">
        <TrendingList initialData={initialTrendings} />
      </TabsContent>

      <TabsContent value="review" className="m-0">
        <IpReviewList initialData={initialPendingReviews} />
      </TabsContent>
    </Tabs>
  )
}
