import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { TaskListReq, CreateTaskReq } from "./schema"

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

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

  const {
    title,
    videoUrl,
    coverUrl,
    seriesId,
    platforms,
    mode,
    scheduledAt,
    platformContents,
  } = parsed.data

  // 确定初始状态
  let initialStatus: "DRAFT" | "SCHEDULED" = "DRAFT"
  if (mode === "SCHEDULED" && scheduledAt) {
    initialStatus = "SCHEDULED"
  }

  const task = await db.publishTask.create({
    data: {
      title,
      videoUrl: videoUrl || null,
      coverUrl: coverUrl || null,
      seriesId: seriesId || null,
      platforms,
      mode,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: initialStatus,
      createdBy: session.user.id,
      platformContents: {
        create: platforms.map((platform) => {
          const content = platformContents?.find((c) => c.platform === platform)
          return {
            platform,
            title: content?.title || null,
            description: content?.description || null,
            hashtags: content?.hashtags || [],
            // YouTube 专属配置
            youtubePrivacyStatus: content?.youtubePrivacyStatus || null,
            youtubeCategoryId: content?.youtubeCategoryId || null,
            youtubePlaylistIds: content?.youtubePlaylistIds || [],
            youtubeThumbnailUrl: content?.youtubeThumbnailUrl || null,
          }
        }),
      },
    },
    include: {
      platformContents: true,
      series: { select: { titleChinese: true, titleOriginal: true } },
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
}
