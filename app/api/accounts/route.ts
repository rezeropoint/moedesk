import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { AccountListReq, CreateAccountReq } from "./schema"

/**
 * GET /api/accounts - 获取当前用户的账号列表
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = AccountListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { platform, status, search, page, pageSize } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: session.user.id }

  if (platform) {
    where.platform = platform
  }

  if (status) {
    where.status = status
  }

  if (search) {
    where.accountName = { contains: search, mode: "insensitive" }
  }

  const [accounts, total] = await Promise.all([
    db.socialAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.socialAccount.count({ where }),
  ])

  const items = accounts.map((a: typeof accounts[number]) => ({
    id: a.id,
    userId: a.userId,
    platform: a.platform,
    accountName: a.accountName,
    accountId: a.accountId,
    accountUrl: a.accountUrl,
    avatarUrl: a.avatarUrl,
    status: a.status,
    lastUsedAt: a.lastUsedAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    // YouTube 专属字段
    channelStats: a.channelStats,
    googleAccountId: a.googleAccountId,
    googleEmail: a.googleEmail,
    googleName: a.googleName,
  }))

  return Response.json({
    data: { items, total, page, pageSize },
  })
}

/**
 * POST /api/accounts - 创建新账号
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "无效的 JSON 数据" }, { status: 400 })
  }

  const parsed = CreateAccountReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { platform, accountName, accountUrl, avatarUrl } = parsed.data

  // 检查是否已存在同名账号
  const existing = await db.socialAccount.findUnique({
    where: {
      userId_platform_accountName: {
        userId: session.user.id,
        platform,
        accountName,
      },
    },
  })

  if (existing) {
    return Response.json(
      { error: "该平台已存在同名账号" },
      { status: 400 }
    )
  }

  const account = await db.socialAccount.create({
    data: {
      userId: session.user.id,
      platform,
      accountName,
      accountUrl: accountUrl || null,
      avatarUrl: avatarUrl || null,
      status: "ACTIVE", // 当前阶段直接设为 ACTIVE，后续 OAuth 改为 PENDING
    },
  })

  return Response.json(
    {
      data: {
        id: account.id,
        userId: account.userId,
        platform: account.platform,
        accountName: account.accountName,
        accountId: account.accountId,
        accountUrl: account.accountUrl,
        avatarUrl: account.avatarUrl,
        status: account.status,
        lastUsedAt: null,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  )
}
