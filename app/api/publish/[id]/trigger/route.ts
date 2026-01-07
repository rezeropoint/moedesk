import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { triggerWorkflow } from "@/lib/n8n"
import { TriggerPublishReq } from "../../schema"
import { getValidAccessToken } from "@/lib/youtube"
import type { PublishPlatform } from "@/types/publish"

interface AccountCredential {
  accountId: string    // SocialAccount.id
  channelId: string    // YouTube 频道 ID
  accessToken: string  // 解密后的有效 token
}

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
      taskAccounts: {
        include: {
          account: {
            select: {
              id: true,
              platform: true,
              accountId: true,
              status: true,
            },
          },
        },
      },
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

  // 获取各平台的账号凭证
  const accountCredentials: Partial<Record<PublishPlatform, AccountCredential>> = {}

  for (const platform of platformsToPublish) {
    // 找到该平台关联的账号
    const taskAccount = task.taskAccounts.find(
      (ta) => ta.account.platform === platform
    )

    if (!taskAccount) {
      // YouTube 平台必须有账号
      if (platform === "YOUTUBE") {
        return Response.json(
          { error: "YouTube 发布需要关联账号" },
          { status: 400 }
        )
      }
      continue
    }

    const account = taskAccount.account

    // 检查账号状态
    if (account.status === "EXPIRED") {
      return Response.json(
        { error: `账号 ${account.accountId || account.id} 授权已过期，请重新授权` },
        { status: 400 }
      )
    }

    if (account.status === "DISABLED") {
      return Response.json(
        { error: `账号 ${account.accountId || account.id} 已被禁用` },
        { status: 400 }
      )
    }

    // 获取有效的 access token
    if (platform === "YOUTUBE") {
      const accessToken = await getValidAccessToken(account.id)
      if (!accessToken) {
        return Response.json(
          { error: `YouTube 账号授权已过期，请重新授权` },
          { status: 400 }
        )
      }

      accountCredentials.YOUTUBE = {
        accountId: account.id,
        channelId: account.accountId || "",
        accessToken,
      }
    }
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
          // YouTube 专属配置
          youtubePrivacyStatus: c.youtubePrivacyStatus,
          youtubeCategoryId: c.youtubeCategoryId,
          youtubePlaylistIds: c.youtubePlaylistIds,
          youtubeThumbnailUrl: c.youtubeThumbnailUrl,
          // 定时发布时间（仅 YouTube 使用）
          publishAt: task.mode === "SCHEDULED" && task.scheduledAt
            ? task.scheduledAt.toISOString()
            : null,
        })),
      // 账号凭证
      accountCredentials,
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
