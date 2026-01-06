/**
 * YouTube OAuth 回调处理 API
 * GET /api/oauth/youtube/callback
 *
 * 处理 Google OAuth 回调：
 * 1. 验证 state 参数
 * 2. 用 code 换取 token
 * 3. 获取 Google 用户信息
 * 4. 获取 YouTube 频道信息
 * 5. 根据频道数量决定流程：
 *    - 0 个频道：创建无频道账号
 *    - 1 个频道：直接绑定
 *    - 多个频道：跳转选择页面
 */

import { NextRequest } from "next/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { encryptToken, encryptTempData } from "@/lib/crypto"
import { Prisma } from "@/lib/generated/prisma/client"
import type { GoogleUserInfo, YouTubeChannel } from "@/lib/youtube"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

/** 临时存储数据结构（用于多频道选择） */
interface TempAuthData {
  tokens: {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
  userinfo: GoogleUserInfo
  channels: YouTubeChannel[]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // 处理用户取消授权
  if (error) {
    console.log("[OAuth] 用户取消授权:", error)
    return redirect(`/settings/accounts?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return redirect("/settings/accounts?error=missing_params")
  }

  // 验证登录状态
  const session = await getSession()
  if (!session) {
    return redirect("/settings/accounts?error=unauthorized")
  }

  // 验证 state 防止 CSRF
  const cookieStore = await cookies()
  const savedState = cookieStore.get("youtube_oauth_state")?.value
  cookieStore.delete("youtube_oauth_state")

  if (state !== savedState) {
    console.error("[OAuth] State 验证失败")
    return redirect("/settings/accounts?error=invalid_state")
  }

  // 检查环境变量
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[OAuth] 缺少 Google OAuth 配置")
    return redirect("/settings/accounts?error=config_error")
  }

  try {
    // Step 1: 用 code 换取 token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("[OAuth] Token 交换失败:", errorData)
      return redirect("/settings/accounts?error=token_exchange_failed")
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Step 2: 获取 Google 用户信息
    const userinfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userinfoResponse.ok) {
      console.error("[OAuth] 获取用户信息失败")
      return redirect("/settings/accounts?error=userinfo_fetch_failed")
    }

    const userinfo: GoogleUserInfo = await userinfoResponse.json()

    // Step 3: 获取 YouTube 频道信息
    const channelResponse = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json()
      console.error("[OAuth] 获取频道信息失败:", errorData)
      return redirect("/settings/accounts?error=channel_fetch_failed")
    }

    const channelData = await channelResponse.json()
    const channels: YouTubeChannel[] = channelData.items || []

    // Step 4: 根据频道数量决定流程
    if (channels.length === 0) {
      // 无频道：创建 Google 账号绑定（无 YouTube 频道）
      await createAccountWithoutChannel(
        session.user.id,
        { access_token, refresh_token, expires_in },
        userinfo
      )
      return redirect("/settings/accounts?success=google_connected_no_channel")
    } else if (channels.length === 1) {
      // 单频道：直接绑定
      await createAccountWithChannel(
        session.user.id,
        { access_token, refresh_token, expires_in },
        userinfo,
        channels[0]
      )
      return redirect("/settings/accounts?success=youtube_connected")
    } else {
      // 多频道：存储临时数据，跳转选择页面
      const tempData: TempAuthData = {
        tokens: { access_token, refresh_token, expires_in },
        userinfo,
        channels,
      }

      cookieStore.set("youtube_temp_auth", encryptTempData(tempData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300, // 5 分钟
        path: "/",
      })

      return redirect("/settings/accounts/select-channel")
    }
  } catch (error) {
    // Next.js redirect() 通过抛出错误实现，需要让它正常传播
    // 检查 digest 属性是否包含 NEXT_REDIRECT
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.includes("NEXT_REDIRECT")
    ) {
      throw error
    }
    console.error("[OAuth] 回调处理错误:", error)
    return redirect("/settings/accounts?error=internal_error")
  }
}

/**
 * 创建无频道的 Google 账号绑定
 */
async function createAccountWithoutChannel(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in: number },
  userinfo: GoogleUserInfo
) {
  const accountName = userinfo.name || userinfo.email || "Google 账号"
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

  // 检查是否已存在该 Google 账号的绑定
  const existing = await db.socialAccount.findFirst({
    where: {
      userId,
      platform: "YOUTUBE",
      googleAccountId: userinfo.sub,
    },
  })

  const accountData = {
    platform: "YOUTUBE" as const,
    accountName,
    accountId: null,
    accountUrl: null,
    avatarUrl: userinfo.picture || null,
    accessToken: encryptToken(tokens.access_token),
    refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
    tokenExpiry,
    status: "ACTIVE" as const,
    channelStats: Prisma.JsonNull,
    googleAccountId: userinfo.sub,
    googleEmail: userinfo.email,
    googleName: userinfo.name,
  }

  if (existing) {
    await db.socialAccount.update({
      where: { id: existing.id },
      data: accountData,
    })
    console.log("[OAuth] 更新 Google 账号（无频道）:", accountName)
  } else {
    await db.socialAccount.create({
      data: {
        userId,
        ...accountData,
      },
    })
    console.log("[OAuth] 创建 Google 账号（无频道）:", accountName)
  }
}

/**
 * 创建带频道的 YouTube 账号绑定
 */
async function createAccountWithChannel(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in: number },
  userinfo: GoogleUserInfo,
  channel: YouTubeChannel
) {
  const accountName = channel.snippet.title
  const accountId = channel.id
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

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
      userId,
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
    refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
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
    console.log("[OAuth] 更新 YouTube 频道:", accountName)
  } else {
    await db.socialAccount.create({
      data: {
        userId,
        ...accountData,
      },
    })
    console.log("[OAuth] 创建 YouTube 频道:", accountName)
  }
}
