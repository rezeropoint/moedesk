/**
 * 确认 YouTube 频道选择 API
 * POST /api/oauth/youtube/confirm-channels
 *
 * 处理多频道选择页面的提交
 */

import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { encryptToken, decryptTempData } from "@/lib/crypto"
import type { GoogleUserInfo, YouTubeChannel } from "@/lib/youtube"

interface TempAuthData {
  tokens: {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
  userinfo: GoogleUserInfo
  channels: YouTubeChannel[]
}

interface RequestBody {
  channelIds: string[]
  /** 刷新模式：更新现有账号而非创建新账号 */
  updatingAccountId?: string
}

export async function POST(request: NextRequest) {
  // 验证登录状态
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 获取临时数据
  const cookieStore = await cookies()
  const tempDataCookie = cookieStore.get("youtube_temp_auth")?.value

  if (!tempDataCookie) {
    return Response.json({ error: "授权已过期，请重新授权" }, { status: 400 })
  }

  const tempData = decryptTempData<TempAuthData>(tempDataCookie)
  if (!tempData) {
    return Response.json({ error: "数据解密失败" }, { status: 400 })
  }

  // 解析请求体
  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 })
  }

  const { channelIds, updatingAccountId } = body
  if (!Array.isArray(channelIds) || channelIds.length === 0) {
    return Response.json({ error: "请选择至少一个频道" }, { status: 400 })
  }

  // 刷新模式下只能选择一个频道
  if (updatingAccountId && channelIds.length > 1) {
    return Response.json({ error: "刷新模式下只能选择一个频道" }, { status: 400 })
  }

  // 验证更新账号的所有权
  if (updatingAccountId) {
    const existingAccount = await db.socialAccount.findUnique({
      where: { id: updatingAccountId },
      select: { userId: true },
    })
    if (!existingAccount || existingAccount.userId !== session.user.id) {
      return Response.json({ error: "无权更新此账号" }, { status: 403 })
    }
  }

  const { tokens, userinfo, channels } = tempData
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

  // 验证选择的频道 ID 是否有效
  const selectedChannels = channels.filter((ch) => channelIds.includes(ch.id))
  if (selectedChannels.length === 0) {
    return Response.json({ error: "选择的频道无效" }, { status: 400 })
  }

  const createdIds: string[] = []

  // 刷新模式：更新现有账号
  if (updatingAccountId) {
    const channel = selectedChannels[0]
    const accountName = channel.snippet.title
    const channelId = channel.id

    // 构建频道 URL
    const channelUrl = channel.snippet.customUrl
      ? `https://youtube.com/${channel.snippet.customUrl}`
      : `https://youtube.com/channel/${channel.id}`

    // 构建头像 URL
    const avatarUrl =
      channel.snippet.thumbnails.high?.url ||
      channel.snippet.thumbnails.medium?.url ||
      channel.snippet.thumbnails.default.url

    // 构建频道统计
    const channelStats = {
      subscriberCount: channel.statistics.hiddenSubscriberCount
        ? 0
        : parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      fetchedAt: new Date().toISOString(),
    }

    await db.socialAccount.update({
      where: { id: updatingAccountId },
      data: {
        accountId: channelId,
        accountName,
        accountUrl: channelUrl,
        avatarUrl,
        channelStats,
        status: "ACTIVE",
      },
    })

    createdIds.push(updatingAccountId)
    console.log("[OAuth] 刷新频道信息:", accountName)

    // 清除临时数据和刷新标记
    cookieStore.delete("youtube_temp_auth")
    cookieStore.delete("updating_account_id")

    return Response.json({
      data: {
        updated: 1,
        accountIds: createdIds,
      },
    })
  }

  // 新绑定模式：为每个选中的频道创建账号
  for (const channel of selectedChannels) {
    const accountName = channel.snippet.title
    const accountId = channel.id

    // 构建频道 URL
    const channelUrl = channel.snippet.customUrl
      ? `https://youtube.com/${channel.snippet.customUrl}`
      : `https://youtube.com/channel/${channel.id}`

    // 构建头像 URL
    const avatarUrl =
      channel.snippet.thumbnails.high?.url ||
      channel.snippet.thumbnails.medium?.url ||
      channel.snippet.thumbnails.default.url

    // 构建频道统计
    const channelStats = {
      subscriberCount: channel.statistics.hiddenSubscriberCount
        ? 0
        : parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      fetchedAt: new Date().toISOString(),
    }

    // 检查是否已存在该频道的绑定
    const existing = await db.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: "YOUTUBE",
        accountId,
      },
    })

    const accountData = {
      platform: "YOUTUBE" as const,
      accountName,
      accountId,
      accountUrl: channelUrl,
      avatarUrl,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: tokens.refresh_token
        ? encryptToken(tokens.refresh_token)
        : null,
      tokenExpiry,
      status: "ACTIVE" as const,
      channelStats,
      googleAccountId: userinfo.sub,
      googleEmail: userinfo.email,
      googleName: userinfo.name,
    }

    if (existing) {
      await db.socialAccount.update({
        where: { id: existing.id },
        data: accountData,
      })
      createdIds.push(existing.id)
      console.log("[OAuth] 更新 YouTube 频道:", accountName)
    } else {
      const newAccount = await db.socialAccount.create({
        data: {
          userId: session.user.id,
          ...accountData,
        },
      })
      createdIds.push(newAccount.id)
      console.log("[OAuth] 创建 YouTube 频道:", accountName)
    }
  }

  // 清除临时数据
  cookieStore.delete("youtube_temp_auth")

  return Response.json({
    data: {
      created: createdIds.length,
      accountIds: createdIds,
    },
  })
}
