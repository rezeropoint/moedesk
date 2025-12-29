"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SourceActivity } from "@/types/analytics"

interface SourceRadarChartProps {
  data: SourceActivity[]
  loading?: boolean
}

// 数据源显示名称映射
const SOURCE_LABELS: Record<string, string> = {
  ANILIST: "AniList",
  GOOGLE_TRENDS: "Google",
  REDDIT: "Reddit",
  TWITTER: "Twitter",
  BILIBILI: "Bilibili",
}

export function SourceRadarChart({ data, loading }: SourceRadarChartProps) {
  const chartData = data.map((item) => ({
    source: SOURCE_LABELS[item.source] || item.source,
    score: item.activityScore,
    fullMark: 100,
  }))

  // 计算数据覆盖率
  const coverage = data.filter((d) => d.hasData).length
  const totalSources = data.length
  const coveragePercent = totalSources > 0 ? Math.round((coverage / totalSources) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">数据源活跃度</CardTitle>
        <p className="text-xs text-muted-foreground">
          各数据源热度归一化到 0-100
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={chartData} cx="50%" cy="50%">
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis
                  dataKey="source"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickCount={5}
                  className="text-muted-foreground"
                />
                <Radar
                  name="活跃度"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value) => [
                    typeof value === "number" ? `${value.toFixed(1)}` : String(value),
                    "活跃度",
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* 数据覆盖率指示器 */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">数据覆盖率</span>
                <span className="font-medium">
                  {coverage}/{totalSources} ({coveragePercent}%)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.map((item) => (
                  <span
                    key={item.source}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.hasData
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {SOURCE_LABELS[item.source] || item.source}
                    {item.hasData ? " ✓" : " ✗"}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
