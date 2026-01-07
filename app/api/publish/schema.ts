import { z } from "zod"

// ============================================================================
// 枚举 Schema
// ============================================================================

export const PublishStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "PARTIAL_FAILED",
  "FAILED",
])

export const PublishPlatformSchema = z.enum([
  "INSTAGRAM",
  "THREADS",
  "YOUTUBE",
])

export const PublishModeSchema = z.enum([
  "IMMEDIATE",
  "SCHEDULED",
  "MANUAL",
])

export const YouTubePrivacyStatusSchema = z.enum([
  "public",
  "unlisted",
  "private",
])

// ============================================================================
// 请求 Schema
// ============================================================================

/** 任务列表请求 */
export const TaskListReq = z.object({
  status: PublishStatusSchema.optional(),
  platform: PublishPlatformSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

/** 平台文案输入 */
export const PlatformContentInput = z.object({
  platform: PublishPlatformSchema,
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  hashtags: z.array(z.string()).max(30).default([]),
  // YouTube 专属配置
  youtubePrivacyStatus: YouTubePrivacyStatusSchema.optional().nullable(),
  youtubeCategoryId: z.string().optional().nullable(),
  youtubePlaylistIds: z.array(z.string()).optional(),
  youtubeThumbnailUrl: z.string().url().optional().nullable().or(z.literal("")),
})

/** 创建任务请求 - 仅基础信息，发布设置在详情面板配置 */
export const CreateTaskReq = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100字符"),
  videoUrl: z.string().url("请输入有效的视频 URL").optional().or(z.literal("")),
  coverUrl: z.string().url("请输入有效的封面 URL").optional().or(z.literal("")),
  seriesId: z.string().optional().nullable(),
  platforms: z.array(PublishPlatformSchema).min(1, "请至少选择一个平台"),
  // 账号选择（按平台分组）: { "YOUTUBE": ["id1", "id2"], "INSTAGRAM": ["id3"] }
  platformAccounts: z.record(z.string(), z.array(z.string())).optional(),
})

/** 更新任务请求 */
export const UpdateTaskReq = z.object({
  title: z.string().min(1).max(100).optional(),
  videoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  seriesId: z.string().optional().nullable(),
  platforms: z.array(PublishPlatformSchema).min(1).optional(),
  mode: PublishModeSchema.optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

/** 更新平台文案请求 */
export const UpdatePlatformContentReq = z.object({
  platform: PublishPlatformSchema,
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  hashtags: z.array(z.string()).max(30).optional(),
  // YouTube 专属配置
  youtubePrivacyStatus: YouTubePrivacyStatusSchema.optional().nullable(),
  youtubeCategoryId: z.string().optional().nullable(),
  youtubePlaylistIds: z.array(z.string()).optional(),
  youtubeThumbnailUrl: z.string().url().optional().nullable().or(z.literal("")),
})

/** 触发发布请求 */
export const TriggerPublishReq = z.object({
  platforms: z.array(PublishPlatformSchema).min(1).optional(),
})

/** n8n 回调请求 */
export const CallbackReq = z.object({
  taskId: z.string(),
  platform: PublishPlatformSchema,
  success: z.boolean(),
  externalId: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
})

// ============================================================================
// 响应 Schema
// ============================================================================

/** 平台文案响应 */
export const PlatformContentItem = z.object({
  id: z.string(),
  taskId: z.string(),
  platform: PublishPlatformSchema,
  title: z.string().nullable(),
  description: z.string().nullable(),
  hashtags: z.array(z.string()),
  // YouTube 专属配置
  youtubePrivacyStatus: z.string().nullable().optional(),
  youtubeCategoryId: z.string().nullable().optional(),
  youtubePlaylistIds: z.array(z.string()).optional(),
  youtubeThumbnailUrl: z.string().nullable().optional(),
})

/** 发布记录响应 */
export const PublishRecordItem = z.object({
  id: z.string(),
  taskId: z.string(),
  platform: PublishPlatformSchema,
  status: PublishStatusSchema,
  externalId: z.string().nullable(),
  externalUrl: z.string().nullable(),
  errorMessage: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
})

/** 任务响应 */
export const TaskItem = z.object({
  id: z.string(),
  title: z.string(),
  videoUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  seriesId: z.string().nullable(),
  seriesTitle: z.string().nullable(),
  platforms: z.array(PublishPlatformSchema),
  mode: PublishModeSchema,
  scheduledAt: z.string().nullable(),
  status: PublishStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  platformContents: z.array(PlatformContentItem),
  records: z.array(PublishRecordItem).optional(),
})

/** 统计数据响应 */
export const StatsResp = z.object({
  draft: z.number(),
  scheduled: z.number(),
  publishedToday: z.number(),
  failed: z.number(),
})

// ============================================================================
// 类型导出
// ============================================================================

export type TaskListReqType = z.infer<typeof TaskListReq>
export type CreateTaskReqType = z.infer<typeof CreateTaskReq>
export type UpdateTaskReqType = z.infer<typeof UpdateTaskReq>
export type UpdatePlatformContentReqType = z.infer<typeof UpdatePlatformContentReq>
export type TriggerPublishReqType = z.infer<typeof TriggerPublishReq>
export type CallbackReqType = z.infer<typeof CallbackReq>
export type TaskItemType = z.infer<typeof TaskItem>
export type StatsRespType = z.infer<typeof StatsResp>
