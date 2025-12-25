/**
 * 热度追踪 API Schema
 */

import { z } from "zod"
import { IpTypeSchema } from "../ips/schema"

/** 热度状态枚举 */
export const TrendingStatusSchema = z.enum([
  "WATCHING",
  "FOCUSED",
  "IN_PROGRESS",
  "ARCHIVED",
])

/** 来源筛选枚举 */
export const SourceFilterSchema = z.enum([
  "ALL",
  "REDDIT",
  "TWITTER",
  "TIKTOK",
  "ANILIST",
  "GOOGLE",
])

/** 热度列表请求参数 */
export const TrendingListReq = z.object({
  type: IpTypeSchema.optional(),
  status: TrendingStatusSchema.optional(),
  source: SourceFilterSchema.default("ALL"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

/** 热度列表项 */
export const TrendingListItem = z.object({
  id: z.string(),
  rank: z.number(),
  ip: z.object({
    id: z.string(),
    type: IpTypeSchema,
    titleOriginal: z.string(),
    titleChinese: z.string().nullable(),
    coverImage: z.string().nullable(),
    tags: z.array(z.string()),
  }),
  totalScore: z.number(),
  growthRate: z.number(),
  heatLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  primarySource: z.string(),
  sources: z.array(z.string()),
  discussionCount: z.number(),
  lastUpdated: z.string(),
  status: TrendingStatusSchema,
})

/** 热度列表响应 */
export const TrendingListResp = z.object({
  items: z.array(TrendingListItem),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

/** 热度统计 */
export const TrendingStatsItem = z.object({
  totalIps: z.number(),
  totalTrendings: z.number(),
  pendingReviews: z.number(),
  watchingCount: z.number(),
  focusedCount: z.number(),
  inProgressCount: z.number(),
})

// 导出类型
export type TrendingListReqType = z.infer<typeof TrendingListReq>
export type TrendingListItemType = z.infer<typeof TrendingListItem>
export type TrendingStatsItemType = z.infer<typeof TrendingStatsItem>
