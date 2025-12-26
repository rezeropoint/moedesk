/**
 * IP 审核记录更新 API
 * PATCH /api/ip-reviews/[id]
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { UpdateReq } from "../schema"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "请求体格式错误" }, { status: 400 })
  }

  const parsed = UpdateReq.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const review = await db.ipReview.findUnique({ where: { id } })

    if (!review) {
      return Response.json({ error: "审核记录不存在" }, { status: 404 })
    }

    const updated = await db.ipReview.update({
      where: { id },
      data: { titleChinese: parsed.data.titleChinese },
      select: { titleChinese: true },
    })

    return Response.json({
      data: { success: true, titleChinese: updated.titleChinese },
    })
  } catch (error) {
    console.error("Failed to update IP review:", error)
    return Response.json({ error: "更新失败" }, { status: 500 })
  }
}
