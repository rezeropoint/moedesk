/**
 * 标题解析 API - 预览解析结果
 * POST /api/entries/parse-title
 */

import { NextRequest } from "next/server"
import { parseTitle } from "@/lib/title-parser"

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title || typeof title !== "string") {
      return Response.json({ error: "标题不能为空" }, { status: 400 })
    }

    const result = parseTitle(title)

    return Response.json({ data: result })
  } catch {
    return Response.json({ error: "解析失败" }, { status: 500 })
  }
}
