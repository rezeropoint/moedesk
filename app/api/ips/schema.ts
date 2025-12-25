/**
 * IP 列表 API Schema
 */

import { z } from "zod"

/** IP 类型枚举 */
export const IpTypeSchema = z.enum([
  "ANIME",
  "GAME",
  "MANGA",
  "LIGHT_NOVEL",
  "VTUBER",
  "MOVIE",
  "OTHER",
])

/** IP 来源枚举 */
export const IpSourceSchema = z.enum(["AUTO", "MANUAL_APPROVED", "MANUAL_ADDED"])

/** IP 列表请求参数 */
export const IpListReq = z.object({
  type: IpTypeSchema.optional(),
  source: IpSourceSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["totalScore", "releaseDate", "createdAt"])
    .default("totalScore"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

/** IP 列表项 */
export const IpItem = z.object({
  id: z.string(),
  type: IpTypeSchema,
  source: IpSourceSchema,
  titleOriginal: z.string(),
  titleChinese: z.string().nullable(),
  titleEnglish: z.string().nullable(),
  coverImage: z.string().nullable(),
  tags: z.array(z.string()),
  releaseDate: z.string().nullable(),
  totalScore: z.number(),
  syncedAt: z.string(),
})

/** IP 列表响应 */
export const IpListResp = z.object({
  items: z.array(IpItem),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
})

// 导出类型
export type IpListReqType = z.infer<typeof IpListReq>
export type IpItemType = z.infer<typeof IpItem>
export type IpListRespType = z.infer<typeof IpListResp>
