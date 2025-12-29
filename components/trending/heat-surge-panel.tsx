"use client"

/**
 * 热度飙升面板
 * 展示 Top N 热度飙升 IP，支持阈值和权重自定义
 */

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TrendingUp, Settings2, Loader2, ArrowUpRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { IpTypeBadge } from "./ip-type-badge"
import type { SurgeItem, SurgeConfig, SourceWeightsConfig, IpType } from "@/types/trending"

interface SurgeApiResponse {
  data: {
    items: SurgeItem[]
    config: SurgeConfig
  }
}

const DEFAULT_WEIGHTS: SourceWeightsConfig = {
  anilist: 0.30,
  google: 0.25,
  reddit: 0.20,
  twitter: 0.15,
  bilibili: 0.10,
}

const WEIGHT_LABELS: Record<keyof SourceWeightsConfig, string> = {
  anilist: "AniList",
  google: "Google",
  reddit: "Reddit",
  twitter: "Twitter",
  bilibili: "B站",
}

export function HeatSurgePanel() {
  const [items, setItems] = useState<SurgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SurgeConfig>({
    threshold: 50,
    limit: 5,
    weights: { ...DEFAULT_WEIGHTS },
  })
  const [pendingConfig, setPendingConfig] = useState<SurgeConfig>({
    threshold: 50,
    limit: 5,
    weights: { ...DEFAULT_WEIGHTS },
  })

  // 获取飙升数据
  const fetchSurgeData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/trendings/surge")
      if (res.ok) {
        const json: SurgeApiResponse = await res.json()
        setItems(json.data.items)
        setConfig(json.data.config)
        setPendingConfig(json.data.config)
      }
    } catch (error) {
      console.error("Failed to fetch surge data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchSurgeData()
  }, [fetchSurgeData])

  // 保存配置
  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/configs/surge_config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: pendingConfig }),
      })

      if (res.ok) {
        setConfig(pendingConfig)
        await fetchSurgeData()
      }
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setSaving(false)
    }
  }

  // 重置权重
  const handleResetWeights = () => {
    setPendingConfig((prev) => ({
      ...prev,
      weights: { ...DEFAULT_WEIGHTS },
    }))
  }

  // 检查配置是否有变更
  const hasConfigChanged = JSON.stringify(config) !== JSON.stringify(pendingConfig)

  // 计算权重总和
  const totalWeight = Object.values(pendingConfig.weights).reduce((sum, w) => sum + w, 0)
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01

  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            热度飙升
            <span className="text-xs font-normal text-muted-foreground">7日</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchSurgeData}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <Tabs defaultValue="threshold" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="threshold">阈值</TabsTrigger>
                    <TabsTrigger value="weights">权重</TabsTrigger>
                  </TabsList>

                  <TabsContent value="threshold" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">飙升阈值</span>
                        <span className="text-sm text-muted-foreground">
                          &gt;= {pendingConfig.threshold}%
                        </span>
                      </div>
                      <Slider
                        value={[pendingConfig.threshold]}
                        onValueChange={(value: number[]) =>
                          setPendingConfig((prev) => ({ ...prev, threshold: value[0] }))
                        }
                        min={10}
                        max={200}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>高敏感 10%</span>
                        <span>低敏感 200%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">显示数量</span>
                        <span className="text-sm text-muted-foreground">
                          Top {pendingConfig.limit}
                        </span>
                      </div>
                      <Slider
                        value={[pendingConfig.limit]}
                        onValueChange={(value: number[]) =>
                          setPendingConfig((prev) => ({ ...prev, limit: value[0] }))
                        }
                        min={3}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="weights" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {(Object.keys(pendingConfig.weights) as Array<keyof SourceWeightsConfig>).map(
                        (key) => (
                          <div key={key} className="flex items-center gap-3">
                            <Label className="w-16 text-xs">{WEIGHT_LABELS[key]}</Label>
                            <Slider
                              value={[pendingConfig.weights[key] * 100]}
                              onValueChange={(value: number[]) =>
                                setPendingConfig((prev) => ({
                                  ...prev,
                                  weights: { ...prev.weights, [key]: value[0] / 100 },
                                }))
                              }
                              min={0}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={Math.round(pendingConfig.weights[key] * 100)}
                              onChange={(e) =>
                                setPendingConfig((prev) => ({
                                  ...prev,
                                  weights: {
                                    ...prev.weights,
                                    [key]: Math.min(100, Math.max(0, Number(e.target.value))) / 100,
                                  },
                                }))
                              }
                              className="w-12 h-8 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              max={100}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={cn(!isWeightValid && "text-destructive")}>
                        总计: {Math.round(totalWeight * 100)}%
                        {!isWeightValid && " (建议为 100%)"}
                      </span>
                      <Button variant="ghost" size="sm" onClick={handleResetWeights}>
                        重置
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  className="w-full mt-4"
                  size="sm"
                  onClick={handleSaveConfig}
                  disabled={saving || !hasConfigChanged}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存设置"
                  )}
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无飙升数据</p>
            <p className="text-xs mt-1">7日变化率 &gt;= {config.threshold}%</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const title = item.titleChinese || item.titleOriginal
              const isTop = index === 0

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    isTop
                      ? "bg-orange-50 dark:bg-orange-950/20"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {/* 排名 */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isTop
                        ? "bg-orange-500 text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* 封面 */}
                  <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0 relative">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage}
                        alt={title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        🔥
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IpTypeBadge type={item.type as IpType} />
                      <span>综合 {item.totalScore}</span>
                    </div>
                  </div>

                  {/* 变化率 */}
                  <div className="flex flex-col items-end shrink-0">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        item.compositeChange >= 100
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          : item.compositeChange >= 50
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                            : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                      )}
                    >
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      {formatChange(item.compositeChange)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground mt-0.5">7日</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
