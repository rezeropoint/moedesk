import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { triggerWorkflow } from "@/lib/n8n"
import { TriggerPublishReq } from "../../schema"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/publish/[id]/trigger - 触发发布
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  let body = {}
  try {
    const text = await request.text()
    if (text) {
      body = JSON.parse(text)
    }
  } catch {
    return Response.json({ error: "无效的 JSON 数据" }, { status: 400 })
  }

  const parsed = TriggerPublishReq.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "参数错误", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const task = await db.publishTask.findUnique({
    where: { id },
    include: {
      platformContents: true,
      series: { select: { titleChinese: true, titleOriginal: true } },
    },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 只有 DRAFT、SCHEDULED、PARTIAL_FAILED 状态可以发布
  if (!["DRAFT", "SCHEDULED", "PARTIAL_FAILED"].includes(task.status)) {
    return Response.json({ error: "当前状态不允许发布" }, { status: 400 })
  }

  const platformsToPublish = parsed.data.platforms || task.platforms

  // 验证要发布的平台都在任务的平台列表中
  const invalidPlatforms = platformsToPublish.filter(
    (p) => !task.platforms.includes(p)
  )
  if (invalidPlatforms.length > 0) {
    return Response.json(
      { error: `无效的平台: ${invalidPlatforms.join(", ")}` },
      { status: 400 }
    )
  }

  // 更新状态为发布中
  await db.publishTask.update({
    where: { id },
    data: { status: "PUBLISHING" },
  })

  // 触发 n8n 工作流
  try {
    const workflowData = {
      taskId: task.id,
      title: task.title,
      videoUrl: task.videoUrl,
      coverUrl: task.coverUrl,
      seriesTitle: task.series?.titleChinese || task.series?.titleOriginal || null,
      platforms: platformsToPublish,
      platformContents: task.platformContents
        .filter((c) => platformsToPublish.includes(c.platform))
        .map((c) => ({
          platform: c.platform,
          title: c.title,
          description: c.description,
          hashtags: c.hashtags,
        })),
    }

    await triggerWorkflow("sop-05-publish-content", workflowData)

    return Response.json({
      data: { success: true, message: "发布任务已触发" },
    })
  } catch (error) {
    // 工作流触发失败，回滚状态
    await db.publishTask.update({
      where: { id },
      data: { status: task.status }, // 恢复原状态
    })

    console.error("Trigger workflow failed:", error)
    return Response.json(
      {
        error: "触发发布工作流失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
