/**
 * 热点雷达模块类型定义
 */

// ============== 枚举类型 ==============

/** IP 类型 */
export type IpType =
  | "ANIME"
  | "GAME"
  | "MANGA"
  | "LIGHT_NOVEL"
  | "VTUBER"
  | "MOVIE"
  | "OTHER"

/** IP 来源 */
export type IpSource = "AUTO" | "MANUAL_APPROVED" | "MANUAL_ADDED"

/** 审核状态 */
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED"

/** 热度追踪状态 */
export type TrendingStatus = "WATCHING" | "FOCUSED" | "IN_PROGRESS" | "ARCHIVED"

// ============== 业务类型 ==============

/** IP 基础信息 */
export interface IpBase {
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
  metadata: Record<string, unknown> | null
  externalUrls: Record<string, string> | null
}

/** 已入库 IP */
export interface Ip extends IpBase {
  source: IpSource
  syncedAt: string
  createdAt: string
  updatedAt: string
}

/** 待审核 IP */
export interface IpReview extends IpBase {
  status: ReviewStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

/** 热度追踪数据 */
export interface Trending {
  id: string
  ipId: string
  ip: Ip
  redditKarma: number | null
  googleTrend: number | null
  twitterMentions: number | null
  biliDanmaku: number | null
  merchandiseScore: number | null
  aiAnalysis: {
    pros?: string[]
    cons?: string[]
    timing?: string
    productSuggestions?: string[]
  } | null
  status: TrendingStatus
  evaluatedAt: string | null
  createdAt: string
  updatedAt: string
}

// ============== 统计类型 ==============

/** 热点雷达统计 */
export interface TrendingStats {
  totalIps: number
  totalTrendings: number
  pendingReviews: number
  watchingCount: number
  focusedCount: number
  inProgressCount: number
}

// ============== 列表项类型（带计算字段） ==============

/** 热度数据 */
export interface HeatData {
  redditKarma: number | null
  googleTrend: number | null
  twitterMentions: number | null
  biliDanmaku: number | null
}

/** 热点列表项（热度排行） */
export interface TrendingListItem {
  id: string
  rank: number
  ip: {
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
  }
  totalScore: number
  growthRate: number
  heatLevel: 1 | 2 | 3
  primarySource: string
  sources: string[]
  discussionCount: number
  lastUpdated: string
  status: TrendingStatus
  heatData: HeatData
}

/** 待审核列表项 */
export interface IpReviewListItem {
  id: string
  type: IpType
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  tags: string[]
  totalScore: number
  status: ReviewStatus
  createdAt: string
}

// ============== 筛选类型 ==============

/** IP 类型筛选 */
export type IpTypeFilter = IpType | "ALL"

/** 热度来源筛选 */
export type SourceFilter =
  | "ALL"
  | "REDDIT"
  | "TWITTER"
  | "TIKTOK"
  | "ANILIST"
  | "GOOGLE"

/** 热度状态筛选 */
export type TrendingStatusFilter = TrendingStatus | "ALL"
