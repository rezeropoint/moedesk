/**
 * YouTube OAuth 授权发起 API
 * GET /api/oauth/youtube/authorize
 *
 * 生成 Google OAuth 授权 URL 并设置 state cookie 防止 CSRF
 */

import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

// OAuth scope（包含 OpenID Connect 获取用户信息）
const SCOPES = [
  "openid",                                           // OpenID Connect
  "email",                                            // 获取邮箱
  "profile",                                          // 获取用户名
  "https://www.googleapis.com/auth/youtube.readonly", // 读取频道信息
  "https://www.googleapis.com/auth/youtube.upload",   // 上传视频
].join(" ")

export async function GET() {
  // 验证登录状态
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "请先登录" }, { status: 401 })
  }

  // 检查环境变量配置
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error("[OAuth] 缺少 Google OAuth 配置")
    return Response.json(
      { error: "OAuth 配置不完整，请联系管理员" },
      { status: 500 }
    )
  }

  // 生成 state 参数防止 CSRF
  const state = crypto.randomUUID()

  // 将 state 存入 cookie（HttpOnly，5分钟过期）
  const cookieStore = await cookies()
  cookieStore.set("youtube_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 分钟
    path: "/",
  })

  // 构建授权 URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
    access_type: "offline", // 获取 refresh_token
    prompt: "consent", // 强制显示授权页面，确保获取 refresh_token
  })

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`

  return Response.json({ data: { authUrl } })
}
