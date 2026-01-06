/**
 * YouTube API 工具库
 * Token 刷新、频道信息获取等
 */

import { db } from "@/lib/db"
import { encryptToken, decryptToken, isTokenExpired } from "@/lib/crypto"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

// ============================================================================
// 类型定义
// ============================================================================

export interface GoogleUserInfo {
  sub: string       // Google 账户 ID
  email: string     // 邮箱
  name: string      // 用户名
  picture?: string  // 头像
}

export interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    customUrl?: string
    thumbnails: {
      default: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
  statistics: {
    subscriberCount: string
    videoCount: string
    viewCount: string
    hiddenSubscriberCount: boolean
  }
}

interface RefreshTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

// ============================================================================
// Token 刷新
// ============================================================================

/**
 * 使用 refresh_token 刷新 access_token
 * @param refreshToken 解密后的 refresh token
 * @returns 新的 access_token 和过期时间，或 null 表示刷新失败
 */
export async function refreshYouTubeToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error("[YouTube] 缺少 Google OAuth 配置")
    return null
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[YouTube] Token 刷新失败:", errorData)
      return null
    }

    const data: RefreshTokenResponse = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
    }
  } catch (error) {
    console.error("[YouTube] Token 刷新异常:", error)
    return null
  }
}

/**
 * 获取有效的 Access Token（自动刷新过期 Token）
 * @param accountId 社媒账号 ID
 * @returns 有效的 access_token，或 null 表示获取失败
 */
export async function getValidAccessToken(
  accountId: string
): Promise<string | null> {
  const account = await db.socialAccount.findUnique({
    where: { id: accountId },
    select: {
      accessToken: true,
      refreshToken: true,
      tokenExpiry: true,
      status: true,
    },
  })

  if (!account || !account.accessToken) {
    return null
  }

  // Token 未过期，直接返回
  if (!isTokenExpired(account.tokenExpiry)) {
    return decryptToken(account.accessToken)
  }

  // Token 已过期，需要刷新
  if (!account.refreshToken) {
    console.warn("[YouTube] 无 refresh_token，无法刷新")
    await db.socialAccount.update({
      where: { id: accountId },
      data: { status: "EXPIRED" },
    })
    return null
  }

  // 执行刷新
  const newTokens = await refreshYouTubeToken(decryptToken(account.refreshToken))
  if (!newTokens) {
    // 刷新失败，标记为过期
    await db.socialAccount.update({
      where: { id: accountId },
      data: { status: "EXPIRED" },
    })
    return null
  }

  // 更新数据库
  await db.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: encryptToken(newTokens.access_token),
      tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
      status: "ACTIVE",
    },
  })

  return newTokens.access_token
}

// ============================================================================
// Google 用户信息
// ============================================================================

/**
 * 获取 Google 用户信息
 * @param accessToken 有效的 access token
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[YouTube] 获取用户信息失败:", errorData)
      return null
    }

    return response.json()
  } catch (error) {
    console.error("[YouTube] 获取用户信息异常:", error)
    return null
  }
}

// ============================================================================
// YouTube 频道信息
// ============================================================================

/**
 * 获取当前用户的所有 YouTube 频道（包括品牌账号）
 * @param accessToken 有效的 access token
 */
export async function getYouTubeChannels(
  accessToken: string
): Promise<YouTubeChannel[]> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[YouTube] 获取频道信息失败:", errorData)
      return []
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("[YouTube] 获取频道信息异常:", error)
    return []
  }
}

/**
 * 刷新频道统计数据
 * @param accountId 社媒账号 ID
 */
export async function refreshChannelStats(accountId: string): Promise<boolean> {
  const accessToken = await getValidAccessToken(accountId)
  if (!accessToken) {
    return false
  }

  const account = await db.socialAccount.findUnique({
    where: { id: accountId },
    select: { accountId: true },
  })

  if (!account?.accountId) {
    return false
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=statistics&id=${account.accountId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    const channel = data.items?.[0]
    if (!channel) {
      return false
    }

    await db.socialAccount.update({
      where: { id: accountId },
      data: {
        channelStats: {
          subscriberCount: channel.statistics.hiddenSubscriberCount
            ? 0
            : parseInt(channel.statistics.subscriberCount) || 0,
          videoCount: parseInt(channel.statistics.videoCount) || 0,
          viewCount: parseInt(channel.statistics.viewCount) || 0,
          fetchedAt: new Date().toISOString(),
        },
      },
    })

    return true
  } catch (error) {
    console.error("[YouTube] 刷新频道统计失败:", error)
    return false
  }
}
