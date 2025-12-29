"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SourceContribution } from "@/types/analytics"

interface SourcePieChartProps {
  data: SourceContribution[]
  loading?: boolean
}

// 数据源显示名称映射
const SOURCE_LABELS: Record<string, string> = {
  REDDIT: "Reddit",
  GOOGLE_TRENDS: "Google",
  ANILIST: "AniList",
  TWITTER: "Twitter",
  BILIBILI: "Bilibili",
}

// 颜色配置
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F"]

export function SourcePieChart({ data, loading }: SourcePieChartProps) {
  const chartData = data.map((item) => ({
    name: SOURCE_LABELS[item.source] || item.source,
    value: item.value,
    percentage: item.percentage,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">数据源贡献度</CardTitle>
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
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value, name, props) => {
                  const payload = props.payload as { percentage: number } | undefined
                  return [`${payload?.percentage ?? 0}%`, String(name)]
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value) => {
                  const item = chartData.find((d) => d.name === value)
                  return `${value} ${item?.percentage || 0}%`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
