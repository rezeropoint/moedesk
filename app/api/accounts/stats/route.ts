import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"

/**
 * GET /api/accounts/stats - 获取账号统计数据
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const userId = session.user.id

  // 并行查询各项统计
  const [total, active, expired, disabled, byPlatformResult] = await Promise.all([
    db.socialAccount.count({ where: { userId } }),
    db.socialAccount.count({ where: { userId, status: "ACTIVE" } }),
    db.socialAccount.count({ where: { userId, status: "EXPIRED" } }),
    db.socialAccount.count({ where: { userId, status: "DISABLED" } }),
    db.socialAccount.groupBy({
      by: ["platform"],
      where: { userId },
      _count: { platform: true },
    }),
  ])

  // 构建按平台统计的 Map
  const byPlatform: Record<string, number> = {
    INSTAGRAM: 0,
    THREADS: 0,
    YOUTUBE: 0,
  }
  for (const item of byPlatformResult) {
    byPlatform[item.platform] = item._count.platform
  }

  return Response.json({
    data: {
      total,
      active,
      expired,
      disabled,
      byPlatform,
    },
  })
}
