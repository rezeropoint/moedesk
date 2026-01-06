import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { getValidAccessToken, getYouTubePlaylists } from "@/lib/youtube"

/**
 * GET /api/youtube/playlists - 获取用户的 YouTube 播放列表
 * 需要提供 accountId 参数，使用 OAuth token 调用
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const accountId = request.nextUrl.searchParams.get("accountId")
  if (!accountId) {
    return Response.json({ error: "缺少 accountId 参数" }, { status: 400 })
  }

  // 验证账号归属
  const account = await db.socialAccount.findUnique({
    where: { id: accountId },
    select: { userId: true, platform: true },
  })

  if (!account || account.userId !== session.user.id) {
    return Response.json({ error: "账号不存在或无权访问" }, { status: 403 })
  }

  if (account.platform !== "YOUTUBE") {
    return Response.json({ error: "该账号不是 YouTube 账号" }, { status: 400 })
  }

  // 获取有效的 access token
  const accessToken = await getValidAccessToken(accountId)
  if (!accessToken) {
    return Response.json({ error: "Token 无效或已过期，请重新授权" }, { status: 401 })
  }

  // 获取播放列表
  const playlists = await getYouTubePlaylists(accessToken)

  return Response.json({ data: playlists })
}
