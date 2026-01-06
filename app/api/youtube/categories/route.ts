import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getYouTubeCategories } from "@/lib/youtube"

/**
 * GET /api/youtube/categories - 获取 YouTube 视频分类列表
 * 公开 API，使用 GOOGLE_API_KEY 调用
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const regionCode = request.nextUrl.searchParams.get("regionCode") || "US"

  const categories = await getYouTubeCategories(regionCode)

  return Response.json({ data: categories })
}
