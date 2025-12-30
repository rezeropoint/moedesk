/**
 * Entry 审核记录更新 API
 * PATCH /api/entries/[id]
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { updateSeriesStats } from "@/lib/series"
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
    const entry = await db.entry.findUnique({
      where: { id },
      select: { id: true, status: true, seriesId: true },
    })

    if (!entry) {
      return Response.json({ error: "审核记录不存在" }, { status: 404 })
    }

    const { titleChinese, seriesId, seasonNumber, seasonLabel } = parsed.data

    // 检查是否修改关联关系
    const isChangingRelation =
      seriesId !== undefined ||
      seasonNumber !== undefined ||
      seasonLabel !== undefined

    // 修改关联关系需要 ADMIN 权限
    if (isChangingRelation && session.user.role !== "ADMIN") {
      return Response.json(
        { error: "修改关联关系需要管理员权限" },
        { status: 403 }
      )
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {}
    if (titleChinese !== undefined) {
      updateData.titleChinese = titleChinese
    }
    if (seriesId !== undefined) {
      updateData.seriesId = seriesId
    }
    if (seasonNumber !== undefined) {
      updateData.seasonNumber = seasonNumber
    }
    if (seasonLabel !== undefined) {
      updateData.seasonLabel = seasonLabel
    }

    // 如果没有更新数据，返回成功
    if (Object.keys(updateData).length === 0) {
      return Response.json({ data: { success: true } })
    }

    // 季度编号检重
    const targetSeriesId = seriesId !== undefined ? seriesId : entry.seriesId
    const targetSeasonNumber =
      seasonNumber !== undefined ? seasonNumber : undefined

    if (targetSeriesId && targetSeasonNumber) {
      const existingEntry = await db.entry.findFirst({
        where: {
          seriesId: targetSeriesId,
          seasonNumber: targetSeasonNumber,
          status: "APPROVED",
          id: { not: id },
        },
      })
      if (existingEntry) {
        return Response.json(
          { error: `该系列已存在第 ${targetSeasonNumber} 季` },
          { status: 400 }
        )
      }
    }

    const previousSeriesId = entry.seriesId

    const updated = await db.entry.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        titleChinese: true,
        seriesId: true,
        seasonNumber: true,
        seasonLabel: true,
      },
    })

    // 更新相关系列统计
    if (previousSeriesId && previousSeriesId !== updated.seriesId) {
      await updateSeriesStats(previousSeriesId)
    }
    if (updated.seriesId) {
      await updateSeriesStats(updated.seriesId)
    }

    return Response.json({ data: { success: true, ...updated } })
  } catch (error) {
    console.error("Failed to update entry:", error)
    return Response.json({ error: "更新失败" }, { status: 500 })
  }
}
