/**
 * 工作流状态切换 API
 * PATCH /api/workflows/[id]/toggle - 切换工作流启用状态
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { toggleN8NWorkflow } from "@/lib/n8n"
import { WorkflowToggleReq } from "./schema"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * 切换工作流启用状态
 * @param request 请求对象
 * @param context 路由上下文（包含 n8n 工作流 ID）
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 检查权限：限制为 ADMIN 角色
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "需要管理员权限" }, { status: 403 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const parsed = WorkflowToggleReq.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { active } = parsed.data

    // 调用 n8n API 切换工作流状态
    const result = await toggleN8NWorkflow(id, active)

    if (!result) {
      return Response.json(
        { error: "切换工作流状态失败，请检查 n8n 连接或 API Key 配置" },
        { status: 500 }
      )
    }

    return Response.json({
      data: {
        id: result.id,
        name: result.name,
        active: result.active,
        updatedAt: result.updatedAt,
      },
    })
  } catch (error) {
    console.error("Failed to toggle workflow:", error)
    return Response.json({ error: "切换工作流状态失败" }, { status: 500 })
  }
}
