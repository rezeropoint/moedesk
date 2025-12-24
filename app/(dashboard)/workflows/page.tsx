/**
 * 工作流配置页面
 * 展示 SOP 工作流与 n8n 的对接状态
 */

import { Settings, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkflowStatsCards } from "@/components/workflows/workflow-stats"
import { WorkflowPhaseTabs } from "@/components/workflows/workflow-phase-tabs"
import {
  SOP_WORKFLOW_DEFINITIONS,
  getWorkflowRuntimeStates,
  getWorkflowStats,
  getN8NEditorUrl,
} from "@/lib/n8n"
import type { WorkflowDisplayItem } from "@/types/workflow"

export const dynamic = "force-dynamic" // 确保每次请求都获取最新数据

export default async function WorkflowsPage() {
  const [runtimeStates, stats] = await Promise.all([
    getWorkflowRuntimeStates(),
    getWorkflowStats(),
  ])

  const workflows: WorkflowDisplayItem[] = SOP_WORKFLOW_DEFINITIONS.map(
    (definition) => ({
      ...definition,
      runtime: runtimeStates.get(definition.id) || {
        workflowId: definition.id,
        status: "inactive",
        isConfigured: false,
        executionStats: {
          total: 0,
          success: 0,
          failed: 0,
          todayCount: 0,
        },
      },
    })
  )

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">工作流配置</h1>
            <p className="text-muted-foreground">
              管理 n8n 自动化工作流，共 {stats.total} 个 SOP 工作流
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a
            href={getN8NEditorUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            打开 n8n
          </a>
        </Button>
      </div>

      {/* 统计概览 */}
      <WorkflowStatsCards stats={stats} />

      {/* 工作流列表（按阶段分组） */}
      <WorkflowPhaseTabs workflows={workflows} />
    </div>
  )
}
