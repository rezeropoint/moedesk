/**
 * Series API - 详情 + 更新 + 删除
 */

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { UpdateSeriesReq } from "../schema"

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/series/[id] - 获取系列详情 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const series = await db.series.findUnique({
    where: { id },
    include: {
      entries: {
        where: { status: "APPROVED" },
        orderBy: { seasonNumber: "asc" },
        select: {
          id: true,
          titleOriginal: true,
          titleChinese: true,
          seasonNumber: true,
          seasonLabel: true,
          totalScore: true,
          releaseDate: true,
          endDate: true,
          coverImage: true,
        },
      },
      trending: {
        select: {
          id: true,
          status: true,
          redditKarma: true,
          googleTrend: true,
          twitterMentions: true,
          biliDanmaku: true,
          merchandiseScore: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!series) {
    return Response.json({ error: "系列不存在" }, { status: 404 })
  }

  return Response.json({
    data: {
      ...series,
      createdAt: series.createdAt.toISOString(),
      updatedAt: series.updatedAt.toISOString(),
      entries: series.entries.map((ip) => ({
        ...ip,
        releaseDate: ip.releaseDate?.toISOString() || null,
        endDate: ip.endDate?.toISOString() || null,
      })),
      trending: series.trending
        ? {
            ...series.trending,
            updatedAt: series.trending.updatedAt.toISOString(),
          }
        : null,
    },
  })
}

/** PATCH /api/series/[id] - 更新系列 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const parsed = UpdateSeriesReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const existing = await db.series.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: "系列不存在" }, { status: 404 })
  }

  const series = await db.series.update({
    where: { id },
    data: parsed.data,
  })

  return Response.json({
    data: {
      id: series.id,
      titleOriginal: series.titleOriginal,
    },
  })
}

/** DELETE /api/series/[id] - 删除系列 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const existing = await db.series.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: "系列不存在" }, { status: 404 })
  }

  // 删除时会级联删除 Trending（ON DELETE CASCADE）
  // Entry 的 seriesId 会被设为 NULL（ON DELETE SET NULL）
  await db.series.delete({ where: { id } })

  return Response.json({ data: { success: true } })
}
