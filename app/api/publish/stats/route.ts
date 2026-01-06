import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"

/**
 * GET /api/publish/stats - 获取发布统计数据
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [draft, scheduled, publishedToday, failed] = await Promise.all([
    db.publishTask.count({ where: { status: "DRAFT" } }),
    db.publishTask.count({ where: { status: "SCHEDULED" } }),
    db.publishTask.count({
      where: {
        status: "PUBLISHED",
        updatedAt: { gte: today },
      },
    }),
    db.publishTask.count({
      where: { status: { in: ["FAILED", "PARTIAL_FAILED"] } },
    }),
  ])

  return Response.json({
    data: { draft, scheduled, publishedToday, failed },
  })
}
