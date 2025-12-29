import { z } from "zod"

/** 数据源分析查询参数 */
export const AnalyticsSourcesReq = z.object({
  trendingIds: z.string().min(1, "请选择至少一个 IP").transform((v) => v.split(",")),
})

export type AnalyticsSourcesReqType = z.infer<typeof AnalyticsSourcesReq>
