import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { UpdateAccountReq } from "../schema"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/accounts/[id] - 获取账号详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
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
    return Response.json({ error: "无权访问" }, { status: 403 })
  }

  return Response.json({
    data: {
      id: account.id,
      userId: account.userId,
      platform: account.platform,
      accountName: account.accountName,
      accountId: account.accountId,
      accountUrl: account.accountUrl,
      avatarUrl: account.avatarUrl,
      status: account.status,
      lastUsedAt: account.lastUsedAt?.toISOString() || null,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    },
  })
}

/**
 * PATCH /api/accounts/[id] - 更新账号
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "无效的 JSON 数据" }, { status: 400 })
  }

  const parsed = UpdateAccountReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { accountName, accountUrl, avatarUrl } = parsed.data

  const updated = await db.socialAccount.update({
    where: { id },
    data: {
      ...(accountName !== undefined && { accountName }),
      ...(accountUrl !== undefined && { accountUrl }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  })

  return Response.json({
    data: {
      id: updated.id,
      userId: updated.userId,
      platform: updated.platform,
      accountName: updated.accountName,
      accountId: updated.accountId,
      accountUrl: updated.accountUrl,
      avatarUrl: updated.avatarUrl,
      status: updated.status,
      lastUsedAt: updated.lastUsedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
}

/**
 * DELETE /api/accounts/[id] - 删除账号
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

  await db.socialAccount.delete({ where: { id } })

  return Response.json({ success: true })
}
