import type { HistoryDataPoint } from "@/types/analytics"

/**
 * 数据源范围定义
 */
interface SourceRange {
  min: number
  max: number
}

/**
 * 计算各数据源的 min/max 范围
 */
export function computeSourceRanges(
  data: HistoryDataPoint[]
): Record<string, SourceRange> {
  const ranges: Record<string, { values: number[] }> = {}

  for (const point of data) {
    if (!ranges[point.source]) {
      ranges[point.source] = { values: [] }
    }
    ranges[point.source].values.push(point.popularity)
  }

  const result: Record<string, SourceRange> = {}
  for (const [source, { values }] of Object.entries(ranges)) {
    if (values.length === 0) continue
    result[source] = {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  return result
}

/**
 * 归一化单个值到 0-100 范围
 */
export function normalizeValue(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 50 // 避免除零，返回中间值
  const normalized = ((value - min) / (max - min)) * 100
  return Math.round(normalized * 10) / 10 // 保留一位小数
}

/**
 * 归一化历史数据点数组
 * 返回带有 normalizedPopularity 字段的数据
 */
export function normalizeHistoryData(
  data: HistoryDataPoint[]
): (HistoryDataPoint & { normalizedPopularity: number })[] {
  const ranges = computeSourceRanges(data)

  return data.map((point) => {
    const range = ranges[point.source]
    const normalizedPopularity = range
      ? normalizeValue(point.popularity, range.min, range.max)
      : 50

    return {
      ...point,
      normalizedPopularity,
    }
  })
}

/**
 * 按数据源分组归一化，用于综合视图
 * 返回按日期和数据源组织的归一化数据
 */
export function groupNormalizedByDateAndSource(
  data: HistoryDataPoint[]
): {
  date: string
  sources: Record<string, number> // source -> normalizedPopularity
}[] {
  const normalized = normalizeHistoryData(data)
  const dateMap = new Map<string, Record<string, number[]>>()

  for (const point of normalized) {
    if (!dateMap.has(point.date)) {
      dateMap.set(point.date, {})
    }
    const dateEntry = dateMap.get(point.date)!
    if (!dateEntry[point.source]) {
      dateEntry[point.source] = []
    }
    dateEntry[point.source].push(point.normalizedPopularity)
  }

  // 转换为数组，每个源取平均值
  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sources]) => {
      const avgSources: Record<string, number> = {}
      for (const [source, values] of Object.entries(sources)) {
        avgSources[source] =
          Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) /
          10
      }
      return { date, sources: avgSources }
    })
}

/**
 * 计算数据源活跃度分数
 * 基于最近值在历史范围内的相对位置
 */
export function computeSourceActivityScores(
  data: HistoryDataPoint[]
): {
  source: string
  activityScore: number
  hasData: boolean
  latestValue: number | null
}[] {
  const ALL_SOURCES = [
    "ANILIST",
    "GOOGLE_TRENDS",
    "REDDIT",
    "TWITTER",
    "BILIBILI",
  ]
  const ranges = computeSourceRanges(data)

  // 找到每个源的最新值
  const latestBySource: Record<string, { value: number; date: string }> = {}
  for (const point of data) {
    const existing = latestBySource[point.source]
    if (!existing || point.date > existing.date) {
      latestBySource[point.source] = {
        value: point.popularity,
        date: point.date,
      }
    }
  }

  return ALL_SOURCES.map((source) => {
    const range = ranges[source]
    const latest = latestBySource[source]

    if (!range || !latest) {
      return {
        source,
        activityScore: 0,
        hasData: false,
        latestValue: null,
      }
    }

    return {
      source,
      activityScore: normalizeValue(latest.value, range.min, range.max),
      hasData: true,
      latestValue: latest.value,
    }
  })
}
