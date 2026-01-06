// 发布模块类型定义（与 Prisma Schema 同步）

// ============================================================================
// 枚举类型
// ============================================================================

/** 发布状态 */
export type PublishStatus =
  | "DRAFT"           // 草稿
  | "SCHEDULED"       // 已排期
  | "PUBLISHING"      // 发布中
  | "PUBLISHED"       // 已发布
  | "PARTIAL_FAILED"  // 部分失败
  | "FAILED"          // 全部失败

/** 发布平台 */
export type PublishPlatform = "INSTAGRAM" | "THREADS" | "YOUTUBE"

/** 发布模式 */
export type PublishMode = "IMMEDIATE" | "SCHEDULED" | "MANUAL"

// ============================================================================
// 业务类型
// ============================================================================

/** 平台文案 */
export interface PublishPlatformContent {
  id: string
  taskId: string
  platform: PublishPlatform
  title: string | null
  description: string | null
  hashtags: string[]
}

/** 发布记录 */
export interface PublishRecord {
  id: string
  taskId: string
  platform: PublishPlatform
  status: PublishStatus
  externalId: string | null
  externalUrl: string | null
  errorMessage: string | null
  publishedAt: string | null
  createdAt: string
}

/** 发布任务 */
export interface PublishTask {
  id: string
  title: string
  videoUrl: string | null
  coverUrl: string | null
  seriesId: string | null
  seriesTitle?: string | null  // 关联系列的标题（用于展示）
  platforms: PublishPlatform[]
  mode: PublishMode
  scheduledAt: string | null
  status: PublishStatus
  createdAt: string
  updatedAt: string
  createdBy: string
  platformContents: PublishPlatformContent[]
  records?: PublishRecord[]
}

/** 发布统计数据 */
export interface PublishStats {
  draft: number
  scheduled: number
  publishedToday: number
  failed: number
}

// ============================================================================
// UI 辅助类型
// ============================================================================

/** 平台配置信息 */
export interface PlatformConfig {
  id: PublishPlatform
  name: string
  icon: string           // Lucide icon name
  colorClass: string     // Tailwind text color class
  maxTitleLength: number
  maxDescLength: number
  maxHashtags: number
}

/** 平台配置映射 */
export const PLATFORM_CONFIGS: Record<PublishPlatform, PlatformConfig> = {
  INSTAGRAM: {
    id: "INSTAGRAM",
    name: "Instagram",
    icon: "Instagram",
    colorClass: "text-brand-instagram",
    maxTitleLength: 0,      // Instagram 无标题
    maxDescLength: 2200,
    maxHashtags: 30,
  },
  THREADS: {
    id: "THREADS",
    name: "Threads",
    icon: "AtSign",         // Threads 图标用 @ 符号
    colorClass: "text-brand-threads",
    maxTitleLength: 0,
    maxDescLength: 500,
    maxHashtags: 10,
  },
  YOUTUBE: {
    id: "YOUTUBE",
    name: "YouTube",
    icon: "Youtube",
    colorClass: "text-brand-youtube",
    maxTitleLength: 100,
    maxDescLength: 5000,
    maxHashtags: 15,
  },
}

/** 状态配置 */
export interface StatusConfig {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
}

/** 状态配置映射 */
export const STATUS_CONFIGS: Record<PublishStatus, StatusConfig> = {
  DRAFT: { label: "草稿", variant: "secondary" },
  SCHEDULED: { label: "已排期", variant: "default" },
  PUBLISHING: { label: "发布中", variant: "outline" },
  PUBLISHED: { label: "已发布", variant: "default" },
  PARTIAL_FAILED: { label: "部分失败", variant: "destructive" },
  FAILED: { label: "发布失败", variant: "destructive" },
}

/** 发布模式配置 */
export interface ModeConfig {
  label: string
  description: string
}

/** 发布模式配置映射 */
export const MODE_CONFIGS: Record<PublishMode, ModeConfig> = {
  IMMEDIATE: { label: "立即发布", description: "确认后立即发布到选中平台" },
  SCHEDULED: { label: "定时发布", description: "设置发布时间，到点自动发布" },
  MANUAL: { label: "人工发布", description: "生成各平台链接，手动复制发布" },
}

// ============================================================================
// 表单类型
// ============================================================================

/** 创建任务表单数据 */
export interface CreateTaskFormData {
  title: string
  videoUrl?: string
  coverUrl?: string
  seriesId?: string
  platforms: PublishPlatform[]
  mode: PublishMode
  scheduledAt?: Date
  platformContents: {
    platform: PublishPlatform
    title?: string
    description?: string
    hashtags: string[]
  }[]
}

/** 筛选条件 */
export interface PublishTaskFilter {
  status?: PublishStatus
  platform?: PublishPlatform
  search?: string
}
