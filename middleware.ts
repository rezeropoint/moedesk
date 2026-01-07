import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const AUTH_COOKIE_NAME = "moedesk-session"
const JWT_SECRET = process.env.JWT_SECRET!

const publicRoutes = ["/login", "/api/auth/login", "/api/publish/callback"]
const adminRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路由，直接通过
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 静态资源，跳过
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // 获取 token
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // 管理员路由检查
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/inbox", request.url))
      }
    }

    return NextResponse.next()
  } catch {
    // Token 无效，重定向到登录
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete(AUTH_COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
