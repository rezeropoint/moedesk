/**
 * 工作流执行日志 API
 * GET /api/workflows/[id]/executions - 获取指定工作流的执行日志
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import {
  getN8NExecutions,
  SOP_WORKFLOW_DEFINITIONS,
  getWorkflowRuntimeStates,
} from "@/lib/n8n"
import { ExecutionListReq } from "../../schema"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  // 验证工作流 ID 是否存在
  const definition = SOP_WORKFLOW_DEFINITIONS.find((d) => d.id === id)
  if (!definition) {
    return Response.json({ error: "工作流不存在" }, { status: 404 })
  }

  // 解析并验证请求参数
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = ExecutionListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { limit, status } = parsed.data

  try {
    // 获取 n8n 工作流 ID
    const runtimeStates = await getWorkflowRuntimeStates()
    const state = runtimeStates.get(id)

    if (!state?.n8nWorkflowId) {
      return Response.json({
        data: {
          executions: [],
          total: 0,
          hasMore: false,
          message: "工作流尚未在 n8n 中配置",
        },
      })
    }

    const result = await getN8NExecutions({
      workflowId: state.n8nWorkflowId,
      limit,
      status,
    })

    return Response.json({ data: result })
  } catch (error) {
    console.error(`Failed to fetch executions for ${id}:`, error)
    return Response.json({ error: "获取执行日志失败" }, { status: 500 })
  }
}
