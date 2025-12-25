/**
 * IP 待审核列表 API
 * GET /api/ip-reviews - 获取待审核 IP 列表
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { IpReviewListReq } from "./schema"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = IpReviewListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { type, status, page, pageSize } = parsed.data

  try {
    const where = {
      status,
      ...(type && { type }),
    }

    const [items, total] = await Promise.all([
      db.ipReview.findMany({
        where,
        orderBy: { totalScore: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          titleOriginal: true,
          titleChinese: true,
          titleEnglish: true,
          description: true,
          coverImage: true,
          tags: true,
          releaseDate: true,
          popularityScore: true,
          ratingScore: true,
          totalScore: true,
          status: true,
          createdAt: true,
        },
      }),
      db.ipReview.count({ where }),
    ])

    return Response.json({
      data: {
        items: items.map((item) => ({
          ...item,
          releaseDate: item.releaseDate?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    console.error("Failed to fetch IP reviews:", error)
    return Response.json({ error: "获取待审核列表失败" }, { status: 500 })
  }
}
