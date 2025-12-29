"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AnalyticsHeader } from "./analytics-header"
import { IpSelector } from "./ip-selector"
import { TimeRangeTabs } from "./time-range-tabs"
import { TrendLineChart } from "./trend-line-chart"
import { ChangeRateBarChart } from "./change-rate-bar-chart"
import { SourceRadarChart } from "./source-radar-chart"
import { MetricsCards } from "./metrics-cards"
import { computeSourceActivityScores } from "@/lib/normalize"
import type {
  SelectedIp,
  TimeRange,
  SourceFilter,
  HistoryDataPoint,
  CompareItem,
  AnalyticsMetrics,
} from "@/types/analytics"

interface AnalyticsContainerProps {
  initialIps: SelectedIp[]
}

export function AnalyticsContainer({ initialIps }: AnalyticsContainerProps) {
  // 状态管理
  const [selectedIps, setSelectedIps] = useState<SelectedIp[]>(initialIps)
  const [timeRange, setTimeRange] = useState<TimeRange>(30)
  const [activeSource, setActiveSource] = useState<SourceFilter>("ALL")

  // 数据状态
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([])
  const [compareData, setCompareData] = useState<CompareItem[]>([])
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)

  // 加载状态
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [loadingSources, setLoadingSources] = useState(false)

  // 基于历史数据计算数据源活跃度
  const sourceActivityData = useMemo(() => {
    return computeSourceActivityScores(historyData)
  }, [historyData])

  // 获取数据
  const fetchData = useCallback(async () => {
    if (selectedIps.length === 0) {
      setHistoryData([])
      setCompareData([])
      setMetrics(null)
      return
    }

    const trendingIds = selectedIps.map((ip) => ip.trendingId).join(",")

    // 并行获取数据
    setLoadingHistory(true)
    setLoadingCompare(true)
    setLoadingSources(true)

    try {
      // 历史数据
      const historyRes = await fetch(
        `/api/trendings/analytics/history?trendingIds=${trendingIds}&days=${timeRange}&source=${activeSource}`
      )
      if (historyRes.ok) {
        const { data } = await historyRes.json()
        setHistoryData(data)
      }
    } catch (error) {
      console.error("获取历史数据失败:", error)
    } finally {
      setLoadingHistory(false)
    }

    try {
      // 对比数据
      const compareRes = await fetch(
        `/api/trendings/analytics/compare?trendingIds=${trendingIds}`
      )
      if (compareRes.ok) {
        const { data } = await compareRes.json()
        setCompareData(data)
      }
    } catch (error) {
      console.error("获取对比数据失败:", error)
    } finally {
      setLoadingCompare(false)
    }

    try {
      // 数据源分析（只获取 metrics）
      const sourcesRes = await fetch(
        `/api/trendings/analytics/sources?trendingIds=${trendingIds}`
      )
      if (sourcesRes.ok) {
        const { metrics: m } = await sourcesRes.json()
        setMetrics(m)
      }
    } catch (error) {
      console.error("获取数据源分析失败:", error)
    } finally {
      setLoadingSources(false)
    }
  }, [selectedIps, timeRange, activeSource])

  // 监听变化重新获取数据
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 处理 IP 选择
  const handleSelectIp = (ip: SelectedIp) => {
    setSelectedIps((prev) => [...prev, ip])
  }

  const handleRemoveIp = (trendingId: string) => {
    setSelectedIps((prev) => prev.filter((ip) => ip.trendingId !== trendingId))
  }

  const isLoading = loadingHistory || loadingCompare || loadingSources

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <AnalyticsHeader onRefresh={fetchData} loading={isLoading} />

      {/* IP 选择器 */}
      <div className="bg-card rounded-lg border p-4">
        <label className="text-sm font-medium mb-2 block">选择 IP</label>
        <IpSelector
          selectedIps={selectedIps}
          onSelect={handleSelectIp}
          onRemove={handleRemoveIp}
          maxSelection={5}
        />
      </div>

      {/* 时间范围 */}
      <TimeRangeTabs value={timeRange} onChange={setTimeRange} />

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主图表 */}
        <div className="lg:col-span-2 space-y-6">
          <TrendLineChart
            data={historyData}
            selectedIps={selectedIps}
            activeSource={activeSource}
            onSourceChange={setActiveSource}
            loading={loadingHistory}
          />
          <ChangeRateBarChart
            data={compareData}
            timeRange={timeRange}
            loading={loadingCompare}
          />
        </div>

        {/* 右侧数据源分析 */}
        <div className="space-y-6">
          <SourceRadarChart data={sourceActivityData} loading={loadingHistory} />
          <MetricsCards metrics={metrics} loading={loadingSources} />
        </div>
      </div>
    </div>
  )
}
