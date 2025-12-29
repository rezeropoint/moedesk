/**
 * Entry 审核通过 API
 * POST /api/entries/[id]/approve
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
    const entry = await db.entry.findUnique({ where: { id } })

    if (!entry) {
      return Response.json({ error: "审核记录不存在" }, { status: 404 })
    }

    if (entry.status !== "PENDING") {
      return Response.json({ error: "该记录已被审核" }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      const { seriesId, createNewSeries, seasonNumber, seasonLabel, reviewNote } = parsed.data

      let targetSeriesId = seriesId

      // 如果没有选择系列且需要创建新系列
      if (!targetSeriesId && createNewSeries) {
        // 创建新系列
        const newSeries = await tx.series.create({
          data: {
            titleOriginal: entry.titleOriginal,
            titleChinese: entry.titleChinese,
            titleEnglish: entry.titleEnglish,
            type: entry.type,
            coverImage: entry.coverImage,
            tags: entry.tags,
            searchKeywords: [
              entry.titleOriginal,
              ...(entry.titleChinese ? [entry.titleChinese] : []),
              ...(entry.titleEnglish ? [entry.titleEnglish] : []),
            ],
            totalSeasons: 1,
            aggregatedScore: entry.totalScore,
          },
        })
        targetSeriesId = newSeries.id

        // 为新系列创建热度追踪记录
        await tx.trending.create({
          data: {
            seriesId: newSeries.id,
            status: "WATCHING",
          },
        })
      } else if (targetSeriesId) {
        // 关联到现有系列，更新统计
        const existingSeasons = await tx.entry.count({
          where: { seriesId: targetSeriesId, status: "APPROVED" },
        })
        const existingEntries = await tx.entry.findMany({
          where: { seriesId: targetSeriesId, status: "APPROVED" },
          select: { totalScore: true },
        })
        const totalScore = existingEntries.reduce((sum, e) => sum + e.totalScore, 0) + entry.totalScore
        const avgScore = Math.round(totalScore / (existingSeasons + 1))

        await tx.series.update({
          where: { id: targetSeriesId },
          data: {
            totalSeasons: existingSeasons + 1,
            aggregatedScore: avgScore,
            // 使用最新的封面
            coverImage: entry.coverImage || undefined,
          },
        })
      }

      // 更新审核状态
      await tx.entry.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNote,
          seriesId: targetSeriesId,
          seasonNumber,
          seasonLabel,
        },
      })
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to approve entry:", error)
    return Response.json({ error: "审核通过失败" }, { status: 500 })
  }
}
