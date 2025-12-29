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

/** 审核状态 */
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED"

/** 热度追踪状态 */
export type TrendingStatus = "WATCHING" | "FOCUSED" | "IN_PROGRESS" | "ARCHIVED"

// ============== 业务类型 ==============

/** 系列 */
export interface Series {
  id: string
  titleOriginal: string
  titleChinese: string | null
  titleEnglish: string | null
  type: IpType
  coverImage: string | null
  description: string | null
  tags: string[]
  searchKeywords: string[]
  totalSeasons: number
  aggregatedScore: number
  createdAt?: string
  updatedAt?: string
}

/** 系列下的季度信息（简化版） */
export interface SeriesSeason {
  id: string
  titleOriginal: string
  titleChinese: string | null
  seasonNumber: number | null
  seasonLabel: string | null
  totalScore: number
  releaseDate: string | null
  endDate: string | null
  coverImage: string | null
}

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

/** IP 条目数据 */
export interface Entry extends IpBase {
  seriesId: string | null
  seasonNumber: number | null
  seasonLabel: string | null
  status: ReviewStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
}

/** 热度追踪数据（关联到系列） */
export interface Trending {
  id: string
  seriesId: string
  series: Series
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
  // AniList 数据（来源于 Entry）
  anilistScore: number        // 综合分
  anilistPopularity: number | null  // 热度
  anilistRating: number | null      // 评分
  // 社媒热度（来源于 Trending）
  redditKarma: number | null
  googleTrend: number | null
  twitterMentions: number | null
  biliDanmaku: number | null
}

/** 热点列表项（热度排行，基于系列） */
export interface TrendingListItem {
  id: string
  rank: number
  series: {
    id: string
    type: IpType
    titleOriginal: string
    titleChinese: string | null
    titleEnglish: string | null
    description: string | null
    coverImage: string | null
    tags: string[]
    totalSeasons: number
    aggregatedScore: number
    searchKeywords: string[]
    /** 最新一季的开播日期 */
    releaseDate: string | null
    /** 最新一季的完结日期 */
    endDate: string | null
  }
  totalScore: number
  growthRate: number
  primarySource: string
  sources: string[]
  discussionCount: number
  lastUpdated: string
  status: TrendingStatus
  heatData: HeatData
}

/** 待审核列表项 */
export interface EntryListItem {
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

// ============== 热度飙升类型 ==============

/** 各数据源变化率 */
export interface SourceChanges {
  anilist?: number
  google?: number
  reddit?: number
  twitter?: number
  bilibili?: number
}

/** 热度飙升项 */
export interface SurgeItem {
  id: string
  ipId: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  type: IpType
  totalScore: number
  compositeChange: number    // 综合变化率（实时计算）
  sourceChanges: SourceChanges
}

/** 数据源权重配置 */
export interface SourceWeightsConfig {
  anilist: number
  google: number
  reddit: number
  twitter: number
  bilibili: number
}

/** 飙升配置（含阈值和权重） */
export interface SurgeConfig {
  threshold: number
  limit: number
  weights: SourceWeightsConfig
}
