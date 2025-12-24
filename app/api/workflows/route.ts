/**
 * 工作流列表 API
 * GET /api/workflows - 获取所有工作流及统计数据
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import {
  SOP_WORKFLOW_DEFINITIONS,
  getWorkflowRuntimeStates,
  getWorkflowStats,
} from "@/lib/n8n"
import { WorkflowListReq } from "./schema"
import type { WorkflowDisplayItem } from "@/types/workflow"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 解析并验证请求参数
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = WorkflowListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { phase } = parsed.data

  try {
    const [runtimeStates, stats] = await Promise.all([
      getWorkflowRuntimeStates(),
      getWorkflowStats(),
    ])

    let workflows: WorkflowDisplayItem[] = SOP_WORKFLOW_DEFINITIONS.map(
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

    // 按阶段筛选
    if (phase) {
      workflows = workflows.filter((w) => w.phase === phase)
    }

    return Response.json({
      data: { workflows, stats },
    })
  } catch (error) {
    console.error("Failed to fetch workflows:", error)
    return Response.json({ error: "获取工作流数据失败" }, { status: 500 })
  }
}
