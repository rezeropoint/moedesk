import { z } from "zod"

// ============================================================================
// 枚举 Schema
// ============================================================================

export const PublishPlatformSchema = z.enum([
  "INSTAGRAM",
  "THREADS",
  "YOUTUBE",
])

export const SocialAccountStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "DISABLED",
])

// ============================================================================
// 请求 Schema
// ============================================================================

/** 账号列表请求 */
export const AccountListReq = z.object({
  platform: PublishPlatformSchema.optional(),
  status: SocialAccountStatusSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

/** 创建账号请求 */
export const CreateAccountReq = z.object({
  platform: PublishPlatformSchema,
  accountName: z.string().min(1, "账号名称不能为空").max(100, "账号名称最多100字符"),
  accountUrl: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  avatarUrl: z.string().url("请输入有效的头像 URL").optional().or(z.literal("")),
})

/** 更新账号请求 */
export const UpdateAccountReq = z.object({
  accountName: z.string().min(1).max(100).optional(),
  accountUrl: z.string().url().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

/** 按平台获取账号请求 */
export const AccountsByPlatformReq = z.object({
  activeOnly: z.coerce.boolean().default(true),
})

// ============================================================================
// 响应 Schema
// ============================================================================

/** 账号响应项 */
export const AccountItem = z.object({
  id: z.string(),
  userId: z.string(),
  platform: PublishPlatformSchema,
  accountName: z.string(),
  accountId: z.string().nullable(),
  accountUrl: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  status: SocialAccountStatusSchema,
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/** 账号统计响应 */
export const AccountStatsResp = z.object({
  total: z.number(),
  active: z.number(),
  expired: z.number(),
  disabled: z.number(),
  byPlatform: z.record(PublishPlatformSchema, z.number()),
})

// ============================================================================
// 类型导出
// ============================================================================

export type AccountListReqType = z.infer<typeof AccountListReq>
export type CreateAccountReqType = z.infer<typeof CreateAccountReq>
export type UpdateAccountReqType = z.infer<typeof UpdateAccountReq>
export type AccountsByPlatformReqType = z.infer<typeof AccountsByPlatformReq>
export type AccountItemType = z.infer<typeof AccountItem>
export type AccountStatsRespType = z.infer<typeof AccountStatsResp>
