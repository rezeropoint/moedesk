import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import {
  saveFile,
  getInternalUrl,
  getPublicUrl,
  getFileType,
  validateFileSize,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_IMAGE_TYPES,
  formatFileSize,
  MAX_VIDEO_SIZE,
  MAX_IMAGE_SIZE,
} from "@/lib/upload"

/**
 * POST /api/upload - 文件上传
 *
 * FormData 参数:
 * - file: 文件对象
 *
 * 返回:
 * - fileName: 存储后的文件名
 * - publicUrl: 外网访问 URL（前端预览用）
 * - internalUrl: 内网访问 URL（n8n 发布用）
 * - type: 文件类型（video/image）
 * - size: 文件大小（字节）
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "请上传文件" }, { status: 400 })
    }

    // 验证文件类型
    const fileType = getFileType(file.type)
    if (!fileType) {
      const allowedTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES]
      return Response.json(
        {
          error: `不支持的文件类型: ${file.type}`,
          details: `允许的类型: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (!validateFileSize(file.size, fileType)) {
      const maxSize = fileType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
      return Response.json(
        {
          error: `文件过大`,
          details: `${fileType === "video" ? "视频" : "图片"}最大 ${formatFileSize(maxSize)}，当前 ${formatFileSize(file.size)}`,
        },
        { status: 400 }
      )
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 保存文件
    const fileName = await saveFile(buffer, file.name)

    return Response.json({
      data: {
        fileName,
        publicUrl: getPublicUrl(fileName),
        internalUrl: getInternalUrl(fileName),
        type: fileType,
        size: file.size,
        originalName: file.name,
      },
    })
  } catch (error) {
    console.error("File upload failed:", error)
    return Response.json(
      {
        error: "文件上传失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
