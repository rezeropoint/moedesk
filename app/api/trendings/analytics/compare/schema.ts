import { z } from "zod"

/** 对比数据查询参数 */
export const AnalyticsCompareReq = z.object({
  trendingIds: z.string().min(1, "请选择至少一个 IP").transform((v) => v.split(",")),
})

export type AnalyticsCompareReqType = z.infer<typeof AnalyticsCompareReq>
