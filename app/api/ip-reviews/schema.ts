/**
 * IP 审核 API Schema
 */

import { z } from "zod"
import { IpTypeSchema } from "../ips/schema"

/** 审核状态枚举 */
export const ReviewStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"])

/** 待审核列表请求参数 */
export const IpReviewListReq = z.object({
  type: IpTypeSchema.optional(),
  status: ReviewStatusSchema.default("PENDING"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

/** 待审核列表项 */
export const IpReviewItem = z.object({
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
export const IpReviewListResp = z.object({
  items: z.array(IpReviewItem),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

/** 审核通过请求 */
export const ApproveReq = z.object({
  reviewNote: z.string().optional(),
})

/** 审核拒绝请求 */
export const RejectReq = z.object({
  reviewNote: z.string().min(1, "请填写拒绝原因"),
})

// 导出类型
export type IpReviewListReqType = z.infer<typeof IpReviewListReq>
export type IpReviewItemType = z.infer<typeof IpReviewItem>
export type ApproveReqType = z.infer<typeof ApproveReq>
export type RejectReqType = z.infer<typeof RejectReq>
