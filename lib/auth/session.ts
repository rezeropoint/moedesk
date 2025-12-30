import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE } from "./constants"
import { verifyToken } from "./jwt"
import { db } from "@/lib/db"

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  // 验证数据库中的会话是否存在
  const session = await db.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return {
    user: session.user,
    sessionId: session.id,
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  // HTTP 环境部署时需设置 SECURE_COOKIE=false
  const useSecureCookie = process.env.SECURE_COOKIE !== "false" && process.env.NODE_ENV === "production"
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export { SESSION_MAX_AGE }
