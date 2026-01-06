/**
 * 刷新 Token API
 * POST /api/accounts/:id/refresh-token
 *
 * 手动刷新账号的 OAuth Token
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { getValidAccessToken, refreshChannelStats } from "@/lib/youtube"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  // 验证登录状态
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 查找账号
  const account = await db.socialAccount.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      platform: true,
      tokenExpiry: true,
      refreshToken: true,
    },
  })

  if (!account) {
    return Response.json({ error: "账号不存在" }, { status: 404 })
  }

  // 验证所有权
  if (account.userId !== session.user.id) {
    return Response.json({ error: "无权操作此账号" }, { status: 403 })
  }

  // 仅支持 YouTube
  if (account.platform !== "YOUTUBE") {
    return Response.json({ error: "此平台不支持 Token 刷新" }, { status: 400 })
  }

  // 检查是否有 refresh_token
  if (!account.refreshToken) {
    return Response.json(
      { error: "无刷新令牌，请重新授权" },
      { status: 400 }
    )
  }

  // 尝试刷新 Token
  const newAccessToken = await getValidAccessToken(id)
  if (!newAccessToken) {
    return Response.json(
      { error: "Token 刷新失败，请重新授权" },
      { status: 400 }
    )
  }

  // 顺便刷新频道统计
  await refreshChannelStats(id)

  // 获取更新后的账号信息
  const updatedAccount = await db.socialAccount.findUnique({
    where: { id },
    select: {
      status: true,
      tokenExpiry: true,
      channelStats: true,
    },
  })

  return Response.json({
    data: {
      status: updatedAccount?.status,
      tokenExpiry: updatedAccount?.tokenExpiry,
      channelStats: updatedAccount?.channelStats,
    },
  })
}
