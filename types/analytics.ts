/**
 * 热度数据分析模块类型定义
 */

import type { IpType, TrendingStatus } from "./trending"

// ============== 选中的 IP ==============

/** 选中的 IP（用于分析） */
export interface SelectedIp {
  trendingId: string
  seriesId: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  type: IpType
}

// ============== 历史数据 ==============

/** 历史数据点（时序） */
export interface HistoryDataPoint {
  date: string                    // ISO 日期字符串 (YYYY-MM-DD)
  trendingId: string
  seriesTitle: string
  source: string
  popularity: number
  rating: number | null
}

/** 历史数据 API 响应 */
export interface HistoryResponse {
  data: HistoryDataPoint[]
  meta: {
    startDate: string
    endDate: string
    sources: string[]
  }
}

// ============== 对比数据 ==============

/** 单个 IP 的对比数据 */
export interface CompareItem {
  trendingId: string
  seriesId: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  type: IpType
  status: TrendingStatus

  // 各时间段变化率
  change7d: number | null
  change30d: number | null
  change90d: number | null

  // 各数据源当前值
  sourceValues: {
    reddit: number | null
    google: number | null
    anilist: number | null
    twitter: number | null
    bilibili: number | null
  }

  // 各数据源变化率
  sourceChanges: {
    reddit: number | null
    google: number | null
    anilist: number | null
    twitter: number | null
    bilibili: number | null
  }
}

/** 对比数据 API 响应 */
export interface CompareResponse {
  data: CompareItem[]
}

// ============== 数据源分析 ==============

/** 数据源贡献度 */
export interface SourceContribution {
  source: string
  value: number               // 总热度值
  percentage: number          // 占比 (0-100)
  count: number               // 数据点数量
}

/** 单个 IP 的数据源分布 */
export interface IpSourceDistribution {
  trendingId: string
  seriesTitle: string
  sources: Array<{
    source: string
    value: number
    percentage: number
  }>
}

/** 分析指标 */
export interface AnalyticsMetrics {
  averageChangeRate: number   // 平均变化率
  topIpId: string             // 最热 IP 的 trendingId
  topIpTitle: string          // 最热 IP 的标题
  sourceCoverage: number      // 数据源覆盖率 (0-1)
}

/** 数据源分析 API 响应 */
export interface SourcesResponse {
  overall: SourceContribution[]
  byIp: IpSourceDistribution[]
  metrics: AnalyticsMetrics
}

// ============== 搜索结果 ==============

/** 搜索结果项 */
export interface SearchResultItem {
  trendingId: string
  seriesId: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  type: IpType
  aggregatedScore: number
}

/** 搜索 API 响应 */
export interface SearchResponse {
  data: SearchResultItem[]
}

// ============== 分析状态 ==============

/** 时间范围 */
export type TimeRange = 7 | 30 | 90

/** 数据源筛选 */
export type SourceFilter = "ALL" | "REDDIT" | "GOOGLE_TRENDS" | "ANILIST" | "TWITTER" | "BILIBILI"

/** 分析页面状态 */
export interface AnalyticsState {
  selectedIps: SelectedIp[]
  timeRange: TimeRange
  activeSource: SourceFilter
}

// ============== 图表数据 ==============

/** 趋势图数据点（转换后） */
export interface TrendChartDataPoint {
  date: string
  [key: string]: string | number  // 动态 key: trendingId -> popularity
}

/** 柱状图数据点 */
export interface BarChartDataPoint {
  name: string
  titleChinese: string | null
  value: number
  fill: string
}

/** 饼图数据点 */
export interface PieChartDataPoint {
  name: string
  value: number
  percentage: number
}
