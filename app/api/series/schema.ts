/**
 * Series API Schema
 */

import { z } from "zod"
import { IpTypeSchema } from "../entries/schema"

/** Series 列表请求参数 */
export const SeriesListReq = z.object({
  type: IpTypeSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

/** Series 搜索请求参数 */
export const SeriesSearchReq = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(20).default(10),
})

/** 创建 Series 请求 */
export const CreateSeriesReq = z.object({
  titleOriginal: z.string().min(1, "原始标题不能为空"),
  titleChinese: z.string().optional(),
  titleEnglish: z.string().optional(),
  type: IpTypeSchema,
  coverImage: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  searchKeywords: z.array(z.string()).default([]),
})

/** 更新 Series 请求 */
export const UpdateSeriesReq = z.object({
  titleOriginal: z.string().min(1).optional(),
  titleChinese: z.string().optional(),
  titleEnglish: z.string().optional(),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
})

/** Series 列表项 */
export const SeriesItem = z.object({
  id: z.string(),
  titleOriginal: z.string(),
  titleChinese: z.string().nullable(),
  titleEnglish: z.string().nullable(),
  type: IpTypeSchema,
  coverImage: z.string().nullable(),
  tags: z.array(z.string()),
  totalSeasons: z.number(),
  aggregatedScore: z.number(),
  createdAt: z.string(),
})

/** Series 列表响应 */
export const SeriesListResp = z.object({
  items: z.array(SeriesItem),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

/** Series 搜索结果项（简化版） */
export const SeriesSearchItem = z.object({
  id: z.string(),
  titleOriginal: z.string(),
  titleChinese: z.string().nullable(),
  type: IpTypeSchema,
  coverImage: z.string().nullable(),
  totalSeasons: z.number(),
})

/** Series 搜索响应 */
export const SeriesSearchResp = z.object({
  items: z.array(SeriesSearchItem),
})

// 导出类型
export type SeriesListReqType = z.infer<typeof SeriesListReq>
export type SeriesSearchReqType = z.infer<typeof SeriesSearchReq>
export type CreateSeriesReqType = z.infer<typeof CreateSeriesReq>
export type UpdateSeriesReqType = z.infer<typeof UpdateSeriesReq>
export type SeriesItemType = z.infer<typeof SeriesItem>
export type SeriesSearchItemType = z.infer<typeof SeriesSearchItem>
