import { NextRequest } from "next/server"
import { existsSync, statSync } from "fs"
import { createReadStream } from "fs"
import path from "path"
import { UPLOAD_DIR } from "@/lib/upload"

type RouteContext = { params: Promise<{ filename: string }> }

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

/**
 * GET /uploads/[filename] - 获取上传的文件
 *
 * 支持 Range 请求（用于视频流式播放）
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { filename } = await context.params

  // 防止路径遍历攻击
  const sanitizedFilename = path.basename(filename)
  const filePath = path.join(UPLOAD_DIR, sanitizedFilename)

  // 检查文件是否存在
  if (!existsSync(filePath)) {
    return new Response("File not found", { status: 404 })
  }

  const stat = statSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const contentType = MIME_TYPES[ext] || "application/octet-stream"

  // 处理 Range 请求（用于视频流式播放）
  const range = request.headers.get("range")
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    const chunkSize = end - start + 1

    const stream = createReadStream(filePath, { start, end })

    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  }

  // 普通请求，返回完整文件
  const stream = createReadStream(filePath)

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Length": stat.size.toString(),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
