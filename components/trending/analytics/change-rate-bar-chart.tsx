"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CompareItem, TimeRange } from "@/types/analytics"

interface ChangeRateBarChartProps {
  data: CompareItem[]
  timeRange: TimeRange
  loading?: boolean
}

export function ChangeRateBarChart({
  data,
  timeRange,
  loading,
}: ChangeRateBarChartProps) {
  const chartData = useMemo(() => {
    return data
      .map((item) => {
        let change: number | null = null
        switch (timeRange) {
          case 7:
            change = item.change7d
            break
          case 30:
            change = item.change30d
            break
          case 90:
            change = item.change90d
            break
        }

        return {
          name: item.titleChinese || item.titleOriginal,
          value: change ?? 0,
          hasData: change !== null,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [data, timeRange])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {timeRange} 日变化率对比
        </CardTitle>
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
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value, _name, props) => {
                  const payload = props.payload as { hasData: boolean } | undefined
                  if (!payload?.hasData) return ["无数据", "变化率"]
                  const numValue = typeof value === "number" ? value : 0
                  return [`${numValue > 0 ? "+" : ""}${numValue.toFixed(2)}%`, "变化率"]
                }}
              />
              <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      !entry.hasData
                        ? "hsl(var(--muted))"
                        : entry.value >= 0
                        ? "hsl(var(--primary))"
                        : "hsl(var(--destructive))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
