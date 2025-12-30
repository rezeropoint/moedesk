/**
 * Entry 审核通过 API
 * POST /api/entries/[id]/approve
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { ApproveReq } from "../../schema"
import {
  parseTitle,
  cleanSearchKeyword,
  generateSearchKeywords,
} from "@/lib/title-parser"

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
      const {
        seriesId,
        createNewSeries,
        seriesBaseName,
        seasonNumber,
        seasonLabel,
        reviewNote,
      } = parsed.data

      // 解析标题获取基础名称和季度信息
      const parsedTitle = parseTitle(entry.titleOriginal)
      const parsedChinese = entry.titleChinese
        ? parseTitle(entry.titleChinese)
        : null

      // 使用用户提供的值或解析结果
      const finalBaseName = seriesBaseName || parsedTitle.baseName
      const finalSeasonNumber =
        seasonNumber ?? parsedChinese?.seasonNumber ?? parsedTitle.seasonNumber
      const finalSeasonLabel =
        seasonLabel ||
        parsedChinese?.seasonLabel ||
        parsedTitle.seasonLabel ||
        null

      let targetSeriesId = seriesId

      // 如果没有选择系列且需要创建新系列
      if (!targetSeriesId && createNewSeries) {
        // 生成清理后的搜索关键词
        const searchKeywords = generateSearchKeywords(
          finalBaseName,
          entry.titleChinese ? cleanSearchKeyword(entry.titleChinese) : null,
          entry.titleEnglish ? cleanSearchKeyword(entry.titleEnglish) : null
        )

        // 创建新系列（使用基础名称而非完整标题）
        const newSeries = await tx.series.create({
          data: {
            titleOriginal: finalBaseName,
            titleChinese: entry.titleChinese
              ? cleanSearchKeyword(entry.titleChinese)
              : null,
            titleEnglish: entry.titleEnglish
              ? cleanSearchKeyword(entry.titleEnglish)
              : null,
            type: entry.type,
            coverImage: entry.coverImage,
            tags: entry.tags,
            searchKeywords,
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
        // 季度编号检重
        if (finalSeasonNumber) {
          const existingEntry = await tx.entry.findFirst({
            where: {
              seriesId: targetSeriesId,
              seasonNumber: finalSeasonNumber,
              status: "APPROVED",
              id: { not: id },
            },
          })
          if (existingEntry) {
            throw new Error(`该系列已存在第 ${finalSeasonNumber} 季`)
          }
        }

        // 关联到现有系列，更新统计
        const existingSeasons = await tx.entry.count({
          where: { seriesId: targetSeriesId, status: "APPROVED" },
        })
        const existingEntries = await tx.entry.findMany({
          where: { seriesId: targetSeriesId, status: "APPROVED" },
          select: { totalScore: true },
        })
        const totalScore =
          existingEntries.reduce((sum, e) => sum + e.totalScore, 0) +
          entry.totalScore
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
          seasonNumber: finalSeasonNumber,
          seasonLabel: finalSeasonLabel,
        },
      })
    })

    return Response.json({ data: { success: true } })
  } catch (error) {
    // 处理季度检重错误
    if (error instanceof Error && error.message.includes("已存在")) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error("Failed to approve entry:", error)
    return Response.json({ error: "审核通过失败" }, { status: 500 })
  }
}
