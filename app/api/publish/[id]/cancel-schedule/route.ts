import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { cancelYouTubeSchedule } from "@/lib/youtube"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/publish/[id]/cancel-schedule - 取消定时发布
 *
 * 仅支持 YouTube 平台：
 * 1. 调用 YouTube API 将视频改为私有（取消 publishAt）
 * 2. 更新任务状态为 DRAFT
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await context.params

  // 获取任务信息
  const task = await db.publishTask.findUnique({
    where: { id },
    include: {
      platformContents: {
        where: { platform: "YOUTUBE" },
      },
      taskAccounts: {
        include: {
          account: true,
        },
      },
    },
  })

  if (!task) {
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  // 只有 SCHEDULED 状态的任务可以取消定时
  if (task.status !== "SCHEDULED") {
    return Response.json(
      { error: "只有已排期的任务可以取消定时" },
      { status: 400 }
    )
  }

  // 检查是否有 YouTube 视频 ID
  const youtubeContent = task.platformContents[0]
  const youtubeVideoId = youtubeContent?.youtubeVideoId

  if (!youtubeVideoId) {
    // 没有视频 ID，可能是 YouTube 之外的平台或尚未上传
    // 直接更新任务状态
    await db.publishTask.update({
      where: { id },
      data: { status: "DRAFT" },
    })

    return Response.json({
      data: { success: true, message: "定时发布已取消" },
    })
  }

  // 获取 YouTube 账号
  const youtubeAccount = task.taskAccounts.find(
    (ta) => ta.account.platform === "YOUTUBE"
  )

  if (!youtubeAccount) {
    return Response.json(
      { error: "未找到关联的 YouTube 账号" },
      { status: 400 }
    )
  }

  // 调用 YouTube API 取消定时发布
  const result = await cancelYouTubeSchedule(
    youtubeAccount.account.id,
    youtubeVideoId
  )

  if (!result.success) {
    return Response.json(
      { error: result.error || "取消定时发布失败" },
      { status: 500 }
    )
  }

  // 更新任务状态
  await db.publishTask.update({
    where: { id },
    data: {
      status: "DRAFT",
      mode: "MANUAL", // 改为手动模式，用户可重新设置定时或立即发布
    },
  })

  return Response.json({
    data: {
      success: true,
      message: "定时发布已取消，视频保持私有状态",
      videoId: youtubeVideoId,
    },
  })
}
