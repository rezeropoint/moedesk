"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { HistoryDataPoint, SelectedIp, SourceFilter } from "@/types/analytics"

interface TrendLineChartProps {
  data: HistoryDataPoint[]
  selectedIps: SelectedIp[]
  activeSource: SourceFilter
  onSourceChange: (source: SourceFilter) => void
  loading?: boolean
}

// 颜色配置
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
]

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: "ALL", label: "综合" },
  { value: "ANILIST", label: "AniList" },
  { value: "GOOGLE_TRENDS", label: "Google" },
  { value: "REDDIT", label: "Reddit" },
  { value: "TWITTER", label: "Twitter" },
  { value: "BILIBILI", label: "Bilibili" },
]

export function TrendLineChart({
  data,
  selectedIps,
  activeSource,
  onSourceChange,
  loading,
}: TrendLineChartProps) {
  // 转换数据为图表格式
  const chartData = useMemo(() => {
    if (!data.length) return []

    // 按日期分组
    const dateMap = new Map<string, Record<string, number>>()

    for (const point of data) {
      // 如果选了特定数据源，只取该数据源的数据
      if (activeSource !== "ALL" && point.source !== activeSource) {
        continue
      }

      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, {})
      }

      const dateEntry = dateMap.get(point.date)!
      const key = point.trendingId

      if (activeSource === "ALL") {
        // 综合模式：累加所有数据源
        dateEntry[key] = (dateEntry[key] || 0) + point.popularity
      } else {
        // 单一数据源模式
        dateEntry[key] = point.popularity
      }
    }

    // 转换为数组
    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date: date.slice(5), // 只显示月-日
        ...values,
      }))
  }, [data, activeSource])

  // 生成图例名称映射
  const ipNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const ip of selectedIps) {
      map[ip.trendingId] = ip.titleChinese || ip.titleOriginal
    }
    return map
  }, [selectedIps])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">热度趋势</CardTitle>
          <Tabs
            value={activeSource}
            onValueChange={(v) => onSourceChange(v as SourceFilter)}
          >
            <TabsList className="h-8">
              {SOURCE_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  className="text-xs px-2"
                >
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
              <Legend
                formatter={(value) => ipNameMap[value] || value}
              />
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
