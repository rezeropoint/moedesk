import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { UpdatePlatformContentReq } from "../../schema"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/publish/[id]/platform-content - 更新平台文案
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

  const parsed = UpdatePlatformContentReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const {
    platform,
    title,
    description,
    hashtags,
    youtubePrivacyStatus,
    youtubeCategoryId,
    youtubePlaylistIds,
    youtubeThumbnailUrl,
  } = parsed.data

  // 验证任务存在且状态允许编辑
  const task = await db.publishTask.findUnique({
    where: { id },
    include: { platformContents: true },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 只有 DRAFT 或 SCHEDULED 状态可以编辑
  if (!["DRAFT", "SCHEDULED"].includes(task.status)) {
    return Response.json({ error: "当前状态不允许编辑" }, { status: 400 })
  }

  // 验证平台在任务的平台列表中
  if (!task.platforms.includes(platform)) {
    return Response.json({ error: "该平台不在任务的目标平台中" }, { status: 400 })
  }

  // 更新或创建平台文案（upsert）
  const platformContent = await db.publishPlatformContent.upsert({
    where: {
      taskId_platform: {
        taskId: id,
        platform,
      },
    },
    update: {
      ...(title !== undefined && { title: title || null }),
      ...(description !== undefined && { description: description || null }),
      ...(hashtags !== undefined && { hashtags }),
      // YouTube 专属配置
      ...(youtubePrivacyStatus !== undefined && { youtubePrivacyStatus: youtubePrivacyStatus || null }),
      ...(youtubeCategoryId !== undefined && { youtubeCategoryId: youtubeCategoryId || null }),
      ...(youtubePlaylistIds !== undefined && { youtubePlaylistIds }),
      ...(youtubeThumbnailUrl !== undefined && { youtubeThumbnailUrl: youtubeThumbnailUrl || null }),
    },
    create: {
      taskId: id,
      platform,
      title: title || null,
      description: description || null,
      hashtags: hashtags || [],
      // YouTube 专属配置
      youtubePrivacyStatus: youtubePrivacyStatus || null,
      youtubeCategoryId: youtubeCategoryId || null,
      youtubePlaylistIds: youtubePlaylistIds || [],
      youtubeThumbnailUrl: youtubeThumbnailUrl || null,
    },
  })

  return Response.json({
    data: {
      id: platformContent.id,
      taskId: platformContent.taskId,
      platform: platformContent.platform,
      title: platformContent.title,
      description: platformContent.description,
      hashtags: platformContent.hashtags,
      // YouTube 专属配置
      youtubePrivacyStatus: platformContent.youtubePrivacyStatus,
      youtubeCategoryId: platformContent.youtubeCategoryId,
      youtubePlaylistIds: platformContent.youtubePlaylistIds,
      youtubeThumbnailUrl: platformContent.youtubeThumbnailUrl,
    },
  })
}
