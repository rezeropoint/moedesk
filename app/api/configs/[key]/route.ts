/**
 * 系统配置 API
 * GET  /api/configs/[key] - 读取配置
 * PUT  /api/configs/[key] - 更新配置（需 ADMIN 权限）
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { ConfigUpdateReq } from "./schema"

type RouteContext = { params: Promise<{ key: string }> }

/**
 * 读取配置
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { key } = await context.params

  try {
    const config = await db.systemConfig.findUnique({
      where: { key },
    })

    if (!config) {
      return Response.json({ error: "配置不存在" }, { status: 404 })
    }

    // 解析 JSON 值
    const value = JSON.parse(config.value)

    return Response.json({
      data: {
        key: config.key,
        value,
        updatedAt: config.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to get config:", error)
    return Response.json({ error: "获取配置失败" }, { status: 500 })
  }
}

/**
 * 更新配置（需 ADMIN 权限）
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 检查 ADMIN 权限
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "需要管理员权限" }, { status: 403 })
  }

  const { key } = await context.params

  try {
    const body = await request.json()
    const parsed = ConfigUpdateReq.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { value } = parsed.data

    // 更新或创建配置
    const config = await db.systemConfig.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    })

    return Response.json({
      data: {
        key: config.key,
        value: JSON.parse(config.value),
        updatedAt: config.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to update config:", error)
    return Response.json({ error: "更新配置失败" }, { status: 500 })
  }
}
