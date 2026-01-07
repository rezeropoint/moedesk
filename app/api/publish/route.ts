import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { TaskListReq, CreateTaskReq } from "./schema"
import type { PublishPlatform, PublishStatus } from "@/types/publish"

/** PublishTask Where 条件类型 */
interface PublishTaskWhereInput {
  status?: PublishStatus
  platforms?: { has: PublishPlatform }
  OR?: Array<{
    title?: { contains: string; mode: "insensitive" }
    series?: { titleChinese: { contains: string; mode: "insensitive" } }
  }>
}

/**
 * GET /api/publish - 获取任务列表
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = TaskListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { status, platform, search, page, pageSize } = parsed.data

  const where: PublishTaskWhereInput = {}

  if (status) {
    where.status = status
  }

  if (platform) {
    where.platforms = { has: platform }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { series: { titleChinese: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [tasks, total] = await Promise.all([
    db.publishTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        series: { select: { titleChinese: true, titleOriginal: true } },
        platformContents: true,
        records: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    }),
    db.publishTask.count({ where }),
  ])

  const items = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    videoUrl: t.videoUrl,
    coverUrl: t.coverUrl,
    seriesId: t.seriesId,
    seriesTitle: t.series?.titleChinese || t.series?.titleOriginal || null,
    platforms: t.platforms,
    mode: t.mode,
    scheduledAt: t.scheduledAt?.toISOString() || null,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    createdBy: t.createdBy,
    platformContents: t.platformContents.map((pc) => ({
      id: pc.id,
      taskId: pc.taskId,
      platform: pc.platform,
      title: pc.title,
      description: pc.description,
      hashtags: pc.hashtags,
      youtubePrivacyStatus: pc.youtubePrivacyStatus,
      youtubeCategoryId: pc.youtubeCategoryId,
      youtubePlaylistIds: pc.youtubePlaylistIds,
      youtubeThumbnailUrl: pc.youtubeThumbnailUrl,
    })),
    records: t.records.map((r) => ({
      id: r.id,
      taskId: r.taskId,
      platform: r.platform,
      status: r.status,
      externalId: r.externalId,
      externalUrl: r.externalUrl,
      errorMessage: r.errorMessage,
      publishedAt: r.publishedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    })),
  }))

  return Response.json({
    data: { items, total, page, pageSize },
  })
}

/**
 * POST /api/publish - 创建新任务
 * 创建时只保存基础信息，状态始终为 DRAFT
 * 发布设置（mode/scheduledAt）在详情面板配置
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

  const parsed = CreateTaskReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { title, videoUrl, coverUrl, seriesId, platforms, platformAccounts } = parsed.data

  try {
    const task = await db.publishTask.create({
      data: {
        title,
        videoUrl: videoUrl || null,
        coverUrl: coverUrl || null,
        seriesId: seriesId || null,
        platforms,
        mode: "SCHEDULED", // 默认定时发布模式
        scheduledAt: null, // 创建时不设置排期时间
        status: "DRAFT", // 始终为草稿状态
        createdBy: session.user.id,
        // 为每个平台创建空文案记录
        platformContents: {
          create: platforms.map((platform) => ({
            platform,
            title: null,
            description: null,
            hashtags: [],
            youtubePrivacyStatus: platform === "YOUTUBE" ? "public" : null,
            youtubeCategoryId: null,
            youtubePlaylistIds: [],
            youtubeThumbnailUrl: null,
          })),
        },
        // 关联账号
        taskAccounts: platformAccounts
          ? {
              create: Object.entries(platformAccounts).flatMap(([, accountIds]) =>
                accountIds.map((accountId) => ({ accountId }))
              ),
            }
          : undefined,
      },
      include: {
        platformContents: true,
        series: { select: { titleChinese: true, titleOriginal: true } },
        taskAccounts: { include: { account: true } },
      },
    })

    return Response.json(
      {
        data: {
          id: task.id,
          title: task.title,
          videoUrl: task.videoUrl,
          coverUrl: task.coverUrl,
          seriesId: task.seriesId,
          seriesTitle: task.series?.titleChinese || task.series?.titleOriginal || null,
          platforms: task.platforms,
          mode: task.mode,
          scheduledAt: task.scheduledAt?.toISOString() || null,
          status: task.status,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          createdBy: task.createdBy,
          platformContents: task.platformContents.map((pc) => ({
            id: pc.id,
            taskId: pc.taskId,
            platform: pc.platform,
            title: pc.title,
            description: pc.description,
            hashtags: pc.hashtags,
            youtubePrivacyStatus: pc.youtubePrivacyStatus,
            youtubeCategoryId: pc.youtubeCategoryId,
            youtubePlaylistIds: pc.youtubePlaylistIds,
            youtubeThumbnailUrl: pc.youtubeThumbnailUrl,
          })),
          records: [],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("创建发布任务失败:", error)
    return Response.json(
      { error: "创建任务失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    )
  }
}
