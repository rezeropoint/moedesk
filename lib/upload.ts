/**
 * 文件上传工具库
 */

import { existsSync, mkdirSync } from "fs"
import { writeFile } from "fs/promises"
import path from "path"

// 上传目录
export const UPLOAD_DIR = path.join(process.cwd(), "uploads")

// 支持的文件类型
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",  // .mov
  "video/x-msvideo",  // .avi
  "video/webm",
]

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

// 文件大小限制（字节）
export const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024  // 2GB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024        // 10MB

// 文件类型
export type FileType = "video" | "image"

/**
 * 确保上传目录存在
 */
export function ensureUploadDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * 生成唯一文件名
 */
export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return `${timestamp}-${random}${ext}`
}

/**
 * 获取文件的 MIME 类型对应的文件类型
 */
export function getFileType(mimeType: string): FileType | null {
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return "video"
  }
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return "image"
  }
  return null
}

/**
 * 验证文件大小
 */
export function validateFileSize(size: number, type: FileType): boolean {
  const maxSize = type === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  return size <= maxSize
}

/**
 * 保存文件到磁盘
 * @returns 保存后的文件名
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  ensureUploadDir()

  const fileName = generateFileName(originalName)
  const filePath = path.join(UPLOAD_DIR, fileName)

  await writeFile(filePath, buffer)

  return fileName
}

/**
 * 获取文件的内网访问 URL（供 n8n 使用）
 */
export function getInternalUrl(fileName: string): string {
  // Docker 内网访问 URL
  return `http://app:3000/uploads/${fileName}`
}

/**
 * 获取文件的外网访问 URL（供前端显示）
 */
export function getPublicUrl(fileName: string): string {
  return `/uploads/${fileName}`
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
