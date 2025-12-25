/**
 * IP 审核拒绝 API
 * POST /api/ip-reviews/[id]/reject
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { RejectReq } from "../../schema"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
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

  const parsed = RejectReq.safeParse(body)
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

    if (review.status !== "PENDING") {
      return Response.json({ error: "该记录已被审核" }, { status: 400 })
    }

    await db.ipReview.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNote: parsed.data.reviewNote,
      },
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to reject IP:", error)
    return Response.json({ error: "审核拒绝失败" }, { status: 500 })
  }
}
