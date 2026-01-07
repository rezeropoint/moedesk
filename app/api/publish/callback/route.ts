import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { CallbackReq } from "../schema"
import type { PublishStatus } from "@/types/publish"

/**
 * OPTIONS /api/publish/callback - CORS 预检请求
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

/**
 * POST /api/publish/callback - n8n 发布结果回调
 *
 * 此接口由 n8n 工作流调用，无需认证
 */
export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "无效的 JSON 数据" }, { status: 400 })
  }

  const parsed = CallbackReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const {
    taskId,
    platform,
    accountId,
    success,
    externalId,
    externalUrl,
    errorMessage,
    publishedAt,
  } = parsed.data

  // 验证任务存在
  const task = await db.publishTask.findUnique({
    where: { id: taskId },
    include: { records: true },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 创建发布记录
  await db.publishRecord.create({
    data: {
      taskId,
      platform,
      accountId: accountId || null,
      status: success ? "PUBLISHED" : "FAILED",
      externalId: externalId || null,
      externalUrl: externalUrl || null,
      errorMessage: errorMessage || null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
  })

  // 保存 YouTube 视频 ID（用于取消定时发布）
  if (platform === "YOUTUBE" && success && externalId) {
    await db.publishPlatformContent.updateMany({
      where: { taskId, platform },
      data: { youtubeVideoId: externalId },
    })
  }

  // 重新获取任务和所有记录，判断最终状态
  const updatedTask = await db.publishTask.findUnique({
    where: { id: taskId },
    include: { records: { orderBy: { createdAt: "desc" } } },
  })

  if (!updatedTask) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 按平台分组，取每个平台最新的记录
  const latestByPlatform = new Map<string, PublishStatus>()
  for (const record of updatedTask.records) {
    if (!latestByPlatform.has(record.platform)) {
      latestByPlatform.set(record.platform, record.status as PublishStatus)
    }
  }

  // 判断最终状态
  const platforms = updatedTask.platforms
  const results = platforms.map(
    (p) => latestByPlatform.get(p) || "PUBLISHING"
  )

  // 检查是否是定时发布（视频已上传但尚未到公开时间）
  const isScheduledPublish = updatedTask.mode === "SCHEDULED" &&
    updatedTask.scheduledAt &&
    new Date(updatedTask.scheduledAt) > new Date()

  let finalStatus: PublishStatus
  if (results.every((s) => s === "PUBLISHED")) {
    // 全部成功
    // 如果是定时发布且还没到时间，保持 SCHEDULED 状态
    finalStatus = isScheduledPublish ? "SCHEDULED" : "PUBLISHED"
  } else if (results.every((s) => s === "FAILED")) {
    // 全部失败
    finalStatus = "FAILED"
  } else if (results.some((s) => s === "PUBLISHING")) {
    // 还有未完成的
    finalStatus = "PUBLISHING"
  } else {
    // 部分失败
    finalStatus = "PARTIAL_FAILED"
  }

  // 更新任务状态
  await db.publishTask.update({
    where: { id: taskId },
    data: { status: finalStatus },
  })

  return Response.json({
    data: {
      success: true,
      taskId,
      platform,
      recordStatus: success ? "PUBLISHED" : "FAILED",
      finalStatus,
    },
  })
}
