import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { PublishPlatformSchema, AccountsByPlatformReq } from "../../schema"
import type { PublishPlatform } from "@/types/publish"
import type { SocialAccountStatus } from "@/types/social-account"

/** SocialAccount Where 条件类型 */
interface SocialAccountWhereInput {
  userId: string
  platform: PublishPlatform
  status?: SocialAccountStatus
}

type RouteContext = { params: Promise<{ platform: string }> }

/**
 * GET /api/accounts/by-platform/[platform] - 按平台获取账号列表
 * 用于创建发布任务时选择账号
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { platform } = await context.params

  // 验证平台参数
  const platformParsed = PublishPlatformSchema.safeParse(platform)
  if (!platformParsed.success) {
    return Response.json({ error: "无效的平台参数" }, { status: 400 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = AccountsByPlatformReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { activeOnly } = parsed.data

  const where: SocialAccountWhereInput = {
    userId: session.user.id,
    platform: platformParsed.data as PublishPlatform,
  }

  if (activeOnly) {
    where.status = "ACTIVE"
  }

  const accounts = await db.socialAccount.findMany({
    where,
    orderBy: { accountName: "asc" },
    select: {
      id: true,
      platform: true,
      accountName: true,
      avatarUrl: true,
      status: true,
      accountId: true,  // 用于判断 YouTube 是否有频道
    },
  })

  return Response.json({
    data: accounts.map((a: typeof accounts[number]) => ({
      id: a.id,
      platform: a.platform,
      accountName: a.accountName,
      avatarUrl: a.avatarUrl,
      // YouTube 账号需要判断是否有频道
      hasChannel: a.platform === "YOUTUBE" ? !!a.accountId : true,
    })),
  })
}
