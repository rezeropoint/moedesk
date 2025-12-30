/**
 * Entry 撤销审核 API (仅 ADMIN)
 * POST /api/entries/[id]/revoke
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { updateSeriesStats } from "@/lib/series"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  // 限制为 ADMIN 角色
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "需要管理员权限" }, { status: 403 })
  }

  const { id } = await context.params

  try {
    const entry = await db.entry.findUnique({
      where: { id },
      select: { id: true, status: true, seriesId: true },
    })

    if (!entry) {
      return Response.json({ error: "审核记录不存在" }, { status: 404 })
    }

    if (entry.status === "PENDING") {
      return Response.json({ error: "该记录尚未审核" }, { status: 400 })
    }

    const previousSeriesId = entry.seriesId

    // 撤销审核：重置为 PENDING 状态
    await db.entry.update({
      where: { id },
      data: {
        status: "PENDING",
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
        seriesId: null,
        seasonNumber: null,
        seasonLabel: null,
      },
    })

    // 如果之前关联了系列，更新系列统计
    if (previousSeriesId) {
      await updateSeriesStats(previousSeriesId)

      // 检查系列是否还有其他 Entry，如果没有则删除系列和 Trending
      const remainingEntries = await db.entry.count({
        where: { seriesId: previousSeriesId, status: "APPROVED" },
      })

      if (remainingEntries === 0) {
        // 删除空系列（Trending 会因为 onDelete: Cascade 级联删除）
        await db.series.delete({ where: { id: previousSeriesId } })
      }
    }

    return Response.json({ data: { success: true } })
  } catch (error) {
    console.error("Failed to revoke entry:", error)
    return Response.json({ error: "撤销审核失败" }, { status: 500 })
  }
}
