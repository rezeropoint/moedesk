"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { normalizeWithGlobalRanges, computeSourceRanges } from "@/lib/normalize"
import type { HistoryDataPoint, SelectedIp, SourceFilter, GlobalSourceRange } from "@/types/analytics"

interface TrendLineChartProps {
  data: HistoryDataPoint[]
  globalRanges: GlobalSourceRange[]
  selectedIps: SelectedIp[]
  activeSource: SourceFilter
  onSourceChange: (source: SourceFilter) => void
  loading?: boolean
}

// 颜色配置 - IP 对比用（直接使用 oklch 颜色值，与 globals.css 中 --chart-* 一致）
const COLORS = [
  "oklch(0.646 0.222 41.116)",  // chart-1 (light)
  "oklch(0.6 0.118 184.704)",   // chart-2 (light)
  "oklch(0.398 0.07 227.392)",  // chart-3 (light)
  "oklch(0.828 0.189 84.429)",  // chart-4 (light)
  "oklch(0.769 0.188 70.08)",   // chart-5 (light)
]

// 数据源颜色配置 - 综合视图用（品牌色，oklch 格式）
const SOURCE_COLORS: Record<string, string> = {
  ANILIST: "oklch(0.65 0.15 230)",      // AniList 蓝
  GOOGLE_TRENDS: "oklch(0.60 0.15 250)", // Google 蓝
  REDDIT: "oklch(0.60 0.22 30)",        // Reddit 橙
  TWITTER: "oklch(0.65 0.15 220)",      // Twitter 蓝
  BILIBILI: "oklch(0.65 0.20 0)",       // Bilibili 粉
}

const SOURCE_LABELS: Record<string, string> = {
  ANILIST: "AniList",
  GOOGLE_TRENDS: "Google",
  REDDIT: "Reddit",
  TWITTER: "Twitter",
  BILIBILI: "Bilibili",
}

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: "ALL", label: "综合" },
  { value: "ANILIST", label: "AniList" },
  { value: "GOOGLE_TRENDS", label: "Google" },
  { value: "REDDIT", label: "Reddit" },
  { value: "TWITTER", label: "Twitter" },
  { value: "BILIBILI", label: "Bilibili" },
]

// 所有数据源列表
const ALL_SOURCES = ["ANILIST", "GOOGLE_TRENDS", "REDDIT", "TWITTER", "BILIBILI"]

export function TrendLineChart({
  data,
  globalRanges,
  selectedIps,
  activeSource,
  onSourceChange,
  loading,
}: TrendLineChartProps) {
  // 综合模式：归一化后按数据源分组展示
  const combinedChartData = useMemo(() => {
    if (!data.length || activeSource !== "ALL") return []

    // 过滤掉 popularity 为 0 的数据（可能是未获取到）
    const validData = data.filter((p) => p.popularity > 0)
    if (!validData.length) return []

    // 使用全局参考范围进行归一化
    const normalized = normalizeWithGlobalRanges(validData, globalRanges)
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
        const result: Record<string, string | number> = {
          date: date.slice(5), // 只显示月-日
        }
        for (const source of ALL_SOURCES) {
          const values = sources[source]
          if (values && values.length > 0) {
            result[source] = Math.round(
              (values.reduce((a, b) => a + b, 0) / values.length) * 10
            ) / 10
          }
        }
        return result
      })
  }, [data, activeSource, globalRanges])

  // 单源模式：原始值多 IP 对比
  // 注意：后端 API 已按 source 参数过滤数据，此处无需再次过滤
  const singleSourceChartData = useMemo(() => {
    if (!data.length || activeSource === "ALL") return []

    const dateMap = new Map<string, Record<string, number>>()

    for (const point of data) {
      // 过滤掉 popularity 为 0 的数据（可能是未获取到）
      if (point.popularity <= 0) continue

      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, {})
      }
      const dateEntry = dateMap.get(point.date)!
      dateEntry[point.trendingId] = point.popularity
    }

    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date: date.slice(5),
        ...values,
      }))
  }, [data, activeSource])

  // 获取有数据的数据源列表
  const availableSources = useMemo(() => {
    if (activeSource !== "ALL") return []
    const ranges = computeSourceRanges(data)
    return ALL_SOURCES.filter((s) => ranges[s])
  }, [data, activeSource])

  // 生成图例名称映射
  const ipNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const ip of selectedIps) {
      map[ip.trendingId] = ip.titleChinese || ip.titleOriginal
    }
    return map
  }, [selectedIps])

  // 判断是否有数据
  const hasData = activeSource === "ALL"
    ? combinedChartData.length > 0
    : singleSourceChartData.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base shrink-0">热度趋势</CardTitle>
          <Tabs
            value={activeSource}
            onValueChange={(v) => onSourceChange(v as SourceFilter)}
          >
            <TabsList className="h-8 overflow-x-auto flex-nowrap">
              {SOURCE_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  className="text-xs px-2 whitespace-nowrap"
                >
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {activeSource === "ALL" && (
          <p className="text-xs text-muted-foreground mt-1">
            综合模式：基于全局历史数据归一化到 0-100
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : !hasData ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        ) : activeSource === "ALL" ? (
          // 综合模式：归一化堆叠面积图
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value, name) => [
                  typeof value === "number" ? `${value.toFixed(1)}` : String(value),
                  SOURCE_LABELS[String(name)] || String(name),
                ]}
              />
              <Legend formatter={(value) => SOURCE_LABELS[value] || value} />
              {availableSources.map((source) => (
                <Area
                  key={source}
                  type="monotone"
                  dataKey={source}
                  name={source}
                  stroke={SOURCE_COLORS[source]}
                  fill={SOURCE_COLORS[source]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          // 单源模式：原始值折线图
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={singleSourceChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
                  return v
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value, name) => [
                  typeof value === "number" ? value.toLocaleString() : String(value),
                  ipNameMap[String(name)] || String(name),
                ]}
              />
              <Legend formatter={(value) => ipNameMap[value] || value} />
              {selectedIps.map((ip, index) => (
                <Line
                  key={ip.trendingId}
                  type="monotone"
                  dataKey={ip.trendingId}
                  name={ip.trendingId}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
