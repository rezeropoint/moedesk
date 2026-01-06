import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { UpdateTaskReq } from "../schema"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/publish/[id] - 获取任务详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  const task = await db.publishTask.findUnique({
    where: { id },
    include: {
      series: { select: { titleChinese: true, titleOriginal: true } },
      platformContents: true,
      records: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  return Response.json({
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
      records: task.records.map((r) => ({
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
    },
  })
}

/**
 * PATCH /api/publish/[id] - 更新任务
 */
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
    return Response.json({ error: "无效的 JSON 数据" }, { status: 400 })
  }

  const parsed = UpdateTaskReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const task = await db.publishTask.findUnique({
    where: { id },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 只有 DRAFT 或 SCHEDULED 状态可以编辑
  if (!["DRAFT", "SCHEDULED"].includes(task.status)) {
    return Response.json({ error: "当前状态不允许编辑" }, { status: 400 })
  }

  const { title, videoUrl, coverUrl, seriesId, platforms, mode, scheduledAt } = parsed.data

  // 计算新状态
  let newStatus = task.status
  const newMode = mode || task.mode
  const newScheduledAt = scheduledAt !== undefined ? scheduledAt : task.scheduledAt?.toISOString()

  if (newMode === "SCHEDULED" && newScheduledAt) {
    newStatus = "SCHEDULED"
  } else if (newMode !== "SCHEDULED" || !newScheduledAt) {
    newStatus = "DRAFT"
  }

  // 如果平台列表有变化，需要同步更新 platformContents
  const platformsChanged = platforms && JSON.stringify(platforms.sort()) !== JSON.stringify([...task.platforms].sort())

  const updatedTask = await db.publishTask.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
      ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
      ...(seriesId !== undefined && { seriesId: seriesId || null }),
      ...(platforms !== undefined && { platforms }),
      ...(mode !== undefined && { mode }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }),
      status: newStatus,
    },
    include: {
      series: { select: { titleChinese: true, titleOriginal: true } },
      platformContents: true,
      records: { orderBy: { createdAt: "desc" } },
    },
  })

  // 如果平台列表有变化，同步 platformContents
  if (platformsChanged && platforms) {
    // 删除不再需要的平台文案
    await db.publishPlatformContent.deleteMany({
      where: {
        taskId: id,
        platform: { notIn: platforms },
      },
    })

    // 为新增的平台创建文案记录
    const existingPlatforms = updatedTask.platformContents.map((pc) => pc.platform)
    const newPlatforms = platforms.filter((p) => !existingPlatforms.includes(p))

    if (newPlatforms.length > 0) {
      await db.publishPlatformContent.createMany({
        data: newPlatforms.map((platform) => ({
          taskId: id,
          platform,
          title: null,
          description: null,
          hashtags: [],
        })),
      })
    }

    // 重新获取更新后的任务
    const refreshedTask = await db.publishTask.findUnique({
      where: { id },
      include: {
        series: { select: { titleChinese: true, titleOriginal: true } },
        platformContents: true,
        records: { orderBy: { createdAt: "desc" } },
      },
    })

    if (refreshedTask) {
      return Response.json({
        data: {
          id: refreshedTask.id,
          title: refreshedTask.title,
          videoUrl: refreshedTask.videoUrl,
          coverUrl: refreshedTask.coverUrl,
          seriesId: refreshedTask.seriesId,
          seriesTitle: refreshedTask.series?.titleChinese || refreshedTask.series?.titleOriginal || null,
          platforms: refreshedTask.platforms,
          mode: refreshedTask.mode,
          scheduledAt: refreshedTask.scheduledAt?.toISOString() || null,
          status: refreshedTask.status,
          createdAt: refreshedTask.createdAt.toISOString(),
          updatedAt: refreshedTask.updatedAt.toISOString(),
          createdBy: refreshedTask.createdBy,
          platformContents: refreshedTask.platformContents.map((pc) => ({
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
          records: refreshedTask.records.map((r) => ({
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
        },
      })
    }
  }

  return Response.json({
    data: {
      id: updatedTask.id,
      title: updatedTask.title,
      videoUrl: updatedTask.videoUrl,
      coverUrl: updatedTask.coverUrl,
      seriesId: updatedTask.seriesId,
      seriesTitle: updatedTask.series?.titleChinese || updatedTask.series?.titleOriginal || null,
      platforms: updatedTask.platforms,
      mode: updatedTask.mode,
      scheduledAt: updatedTask.scheduledAt?.toISOString() || null,
      status: updatedTask.status,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString(),
      createdBy: updatedTask.createdBy,
      platformContents: updatedTask.platformContents.map((pc) => ({
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
      records: updatedTask.records.map((r) => ({
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
    },
  })
}

/**
 * DELETE /api/publish/[id] - 删除任务
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  const task = await db.publishTask.findUnique({
    where: { id },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 只有 DRAFT、SCHEDULED、FAILED、PARTIAL_FAILED 状态可以删除
  if (!["DRAFT", "SCHEDULED", "FAILED", "PARTIAL_FAILED"].includes(task.status)) {
    return Response.json({ error: "当前状态不允许删除" }, { status: 400 })
  }

  // 级联删除（Prisma schema 已配置 onDelete: Cascade）
  await db.publishTask.delete({
    where: { id },
  })

  return new Response(null, { status: 204 })
}
