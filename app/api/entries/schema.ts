/**
 * Entry 审核 API Schema
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

/** 审核状态枚举 */
export const ReviewStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"])

/** 待审核列表请求参数 */
export const EntryListReq = z.object({
  type: IpTypeSchema.optional(),
  status: ReviewStatusSchema.default("PENDING"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

/** 待审核列表项 */
export const EntryItem = z.object({
  id: z.string(),
  type: IpTypeSchema,
  titleOriginal: z.string(),
  titleChinese: z.string().nullable(),
  coverImage: z.string().nullable(),
  tags: z.array(z.string()),
  totalScore: z.number(),
  status: ReviewStatusSchema,
  createdAt: z.string(),
})

/** 待审核列表响应 */
export const EntryListResp = z.object({
  items: z.array(EntryItem),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

/** 审核通过请求 */
export const ApproveReq = z.object({
  reviewNote: z.string().optional(),
  // 系列关联
  seriesId: z.string().optional(),           // 选择现有系列
  createNewSeries: z.boolean().default(true), // 如果没有选择系列，是否创建新系列
  // 季度信息
  seasonNumber: z.number().min(1).optional(),   // 第几季
  seasonLabel: z.string().optional(),            // 季度标签 ("S1", "剧场版", "OVA")
})

/** 审核拒绝请求 */
export const RejectReq = z.object({
  reviewNote: z.string().min(1, "请填写拒绝原因"),
})

/** 更新 Entry 审核记录请求 */
export const UpdateReq = z.object({
  titleChinese: z.string().min(1, "中文标题不能为空").max(200, "标题过长"),
})

// 导出类型
export type EntryListReqType = z.infer<typeof EntryListReq>
export type EntryItemType = z.infer<typeof EntryItem>
export type ApproveReqType = z.infer<typeof ApproveReq>
export type RejectReqType = z.infer<typeof RejectReq>
export type UpdateReqType = z.infer<typeof UpdateReq>
