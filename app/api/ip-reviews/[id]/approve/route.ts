/**
 * IP 审核通过 API
 * POST /api/ip-reviews/[id]/approve
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { ApproveReq } from "../../schema"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  let body = {}
  try {
    body = await request.json()
  } catch {
    // 允许空 body
  }

  const parsed = ApproveReq.safeParse(body)
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

    await db.$transaction(async (tx) => {
      // 更新审核状态
      await tx.ipReview.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNote: parsed.data.reviewNote,
        },
      })

      // 创建正式 IP 记录
      await tx.ip.create({
        data: {
          id: review.id,
          type: review.type,
          source: "MANUAL_APPROVED",
          titleOriginal: review.titleOriginal,
          titleChinese: review.titleChinese,
          titleEnglish: review.titleEnglish,
          description: review.description,
          coverImage: review.coverImage,
          tags: review.tags,
          releaseDate: review.releaseDate,
          endDate: review.endDate,
          popularityScore: review.popularityScore,
          ratingScore: review.ratingScore,
          totalScore: review.totalScore,
          metadata: review.metadata || undefined,
          externalUrls: review.externalUrls || undefined,
        },
      })

      // 创建热度追踪记录
      await tx.trending.create({
        data: {
          ipId: review.id,
          status: "WATCHING",
        },
      })
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to approve IP:", error)
    return Response.json({ error: "审核通过失败" }, { status: 500 })
  }
}
