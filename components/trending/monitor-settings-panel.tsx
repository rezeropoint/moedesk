"use client"

/**
 * 监测设置面板
 * 控制热点监测相关工作流的启用/禁用状态
 */

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Settings,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 监测工作流定义
 * 只展示与热点雷达相关的工作流（sop-01, sop-02）
 */
const MONITOR_WORKFLOWS = [
  {
    sopId: "sop-01-anilist-sync",
    name: "AniList 新番同步",
    triggerConfig: "每周一 09:00 UTC",
  },
  {
    sopId: "sop-02-reddit-monitor",
    name: "Reddit 热度监测",
    triggerConfig: "每日 05:00",
  },
  {
    sopId: "sop-02-google-trends",
    name: "Google Trends 追踪",
    triggerConfig: "每日 04:00",
  },
] as const

interface WorkflowState {
  sopId: string
  n8nWorkflowId: string | null
  active: boolean
  isConfigured: boolean
}

interface WorkflowDisplayItem {
  id: string
  runtime: {
    n8nWorkflowId?: string
    status: "active" | "inactive" | "error"
    isConfigured: boolean
  }
}

interface WorkflowApiResponse {
  data: {
    workflows: WorkflowDisplayItem[]
  }
}

export function MonitorSettingsPanel() {
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 获取工作流状态
  const fetchWorkflowStates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/workflows?phase=content_production")
      if (!res.ok) throw new Error("获取工作流状态失败")

      const json: WorkflowApiResponse = await res.json()
      const workflows = json.data.workflows

      // 筛选出监测相关的工作流并构建状态
      const states: WorkflowState[] = MONITOR_WORKFLOWS.map((mw) => {
        const workflow = workflows.find((w) => w.id === mw.sopId)
        return {
          sopId: mw.sopId,
          n8nWorkflowId: workflow?.runtime.n8nWorkflowId ?? null,
          active: workflow?.runtime.status === "active",
          isConfigured: workflow?.runtime.isConfigured ?? false,
        }
      })

      setWorkflowStates(states)
    } catch (err) {
      console.error("Failed to fetch workflow states:", err)
      setError("获取工作流状态失败")
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    fetchWorkflowStates()
  }, [fetchWorkflowStates])

  // 切换工作流状态
  const handleToggle = async (sopId: string, newActive: boolean) => {
    const state = workflowStates.find((s) => s.sopId === sopId)
    if (!state?.n8nWorkflowId) {
      setError("工作流未在 n8n 中配置")
      return
    }

    setToggling(sopId)
    setError(null)

    try {
      const res = await fetch(`/api/workflows/${state.n8nWorkflowId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "切换失败")
      }

      // 更新本地状态
      setWorkflowStates((prev) =>
        prev.map((s) => (s.sopId === sopId ? { ...s, active: newActive } : s))
      )
    } catch (err) {
      console.error("Failed to toggle workflow:", err)
      setError(err instanceof Error ? err.message : "切换工作流状态失败")
    } finally {
      setToggling(null)
    }
  }

  // 获取 n8n 编辑器 URL
  const getEditorUrl = (n8nWorkflowId: string | null): string => {
    const baseUrl =
      process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678"
    if (n8nWorkflowId) {
      return `${baseUrl}/workflow/${n8nWorkflowId}`
    }
    return `${baseUrl}/workflows`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            监测设置
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchWorkflowStates}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-2 bg-destructive/10 rounded">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {MONITOR_WORKFLOWS.map((workflow) => {
              const state = workflowStates.find(
                (s) => s.sopId === workflow.sopId
              )
              const isToggling = toggling === workflow.sopId

              return (
                <div
                  key={workflow.sopId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={workflow.sopId}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {workflow.name}
                      </Label>
                      {!state?.isConfigured && (
                        <Badge variant="outline" className="text-xs">
                          未配置
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {workflow.triggerConfig}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* 编辑按钮 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      asChild
                    >
                      <a
                        href={getEditorUrl(state?.n8nWorkflowId ?? null)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="在 n8n 中编辑"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>

                    {/* 开关 */}
                    <div className="relative">
                      {isToggling && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                      <Switch
                        id={workflow.sopId}
                        checked={state?.active ?? false}
                        disabled={!state?.isConfigured || isToggling}
                        onCheckedChange={(checked) =>
                          handleToggle(workflow.sopId, checked)
                        }
                        className={cn(isToggling && "opacity-30")}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 底部提示 */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                定时配置需在 n8n 编辑器中修改，点击外链图标跳转。
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
