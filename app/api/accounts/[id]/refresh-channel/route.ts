/**
 * 刷新频道信息 API
 * POST /api/accounts/:id/refresh-channel
 *
 * 检测并绑定用户新创建的 YouTube 频道
 */

import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { encryptToken, encryptTempData } from "@/lib/crypto"
import {
  getValidAccessToken,
  getYouTubeChannels,
  getGoogleUserInfo,
} from "@/lib/youtube"

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
      accountId: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiry: true,
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
    return Response.json({ error: "此平台不支持刷新频道" }, { status: 400 })
  }

  // 获取有效的 Access Token
  const accessToken = await getValidAccessToken(id)
  if (!accessToken) {
    return Response.json(
      { error: "Token 已过期，请重新授权" },
      { status: 400 }
    )
  }

  // 获取 YouTube 频道列表
  const channels = await getYouTubeChannels(accessToken)

  // 没有频道
  if (channels.length === 0) {
    return Response.json({
      status: "no_channel",
      message: "该 Google 账号暂无 YouTube 频道",
    })
  }

  // 辅助函数：更新频道信息
  const updateChannelInfo = async (channel: typeof channels[0]) => {
    const channelUrl = channel.snippet.customUrl
      ? `https://youtube.com/${channel.snippet.customUrl}`
      : `https://youtube.com/channel/${channel.id}`

    const avatarUrl =
      channel.snippet.thumbnails.high?.url ||
      channel.snippet.thumbnails.medium?.url ||
      channel.snippet.thumbnails.default.url

    const channelStats = {
      subscriberCount: channel.statistics.hiddenSubscriberCount
        ? 0
        : parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      fetchedAt: new Date().toISOString(),
    }

    return db.socialAccount.update({
      where: { id },
      data: {
        accountId: channel.id,
        accountName: channel.snippet.title,
        accountUrl: channelUrl,
        avatarUrl,
        channelStats,
        status: "ACTIVE",
      },
      select: {
        id: true,
        accountName: true,
        accountId: true,
        accountUrl: true,
        avatarUrl: true,
        channelStats: true,
        status: true,
      },
    })
  }

  // 如果账号已绑定频道，直接刷新该频道信息
  if (account.accountId) {
    const boundChannel = channels.find((ch) => ch.id === account.accountId)
    if (boundChannel) {
      const updatedAccount = await updateChannelInfo(boundChannel)
      return Response.json({
        status: "updated",
        data: updatedAccount,
      })
    }
    // 原绑定频道不存在了，按无频道处理
  }

  // 只有一个频道，直接更新
  if (channels.length === 1) {
    const updatedAccount = await updateChannelInfo(channels[0])
    return Response.json({
      status: "updated",
      data: updatedAccount,
    })
  }

  // 多个频道，需要跳转选择页面
  // 获取 Google 用户信息
  const userinfo = await getGoogleUserInfo(accessToken)
  if (!userinfo) {
    return Response.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    )
  }

  // 获取当前账号的 token 信息（用于后续确认时使用）
  const tokenExpiry = account.tokenExpiry
  const expiresIn = tokenExpiry
    ? Math.max(0, Math.floor((tokenExpiry.getTime() - Date.now()) / 1000))
    : 3600

  // 构建临时数据（刷新模式不传递 refresh_token，保留现有的）
  const tempData = {
    tokens: {
      access_token: accessToken,
      expires_in: expiresIn,
    },
    userinfo,
    channels,
  }

  // 加密并存入 Cookie
  const encryptedData = encryptTempData(tempData)
  const cookieStore = await cookies()

  cookieStore.set("youtube_temp_auth", encryptedData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 分钟有效
    path: "/",
  })

  // 存入更新账号 ID 标识
  cookieStore.set("updating_account_id", id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return Response.json({
    status: "multi_channel",
    redirectUrl: "/settings/accounts/select-channel",
    channelCount: channels.length,
  })
}
