import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/accounts/[id]/toggle-status - 切换账号启用/禁用状态
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  const account = await db.socialAccount.findUnique({
    where: { id },
  })

  if (!account) {
    return Response.json({ error: "账号不存在" }, { status: 404 })
  }

  // 验证所有权
  if (account.userId !== session.user.id) {
    return Response.json({ error: "无权操作" }, { status: 403 })
  }

  // 切换状态：DISABLED <-> ACTIVE
  // PENDING 和 EXPIRED 状态不受影响（需要通过其他流程处理）
  let newStatus = account.status
  if (account.status === "DISABLED") {
    newStatus = "ACTIVE"
  } else if (account.status === "ACTIVE") {
    newStatus = "DISABLED"
  }

  const updated = await db.socialAccount.update({
    where: { id },
    data: { status: newStatus },
  })

  return Response.json({
    data: {
      id: updated.id,
      status: updated.status,
    },
  })
}
