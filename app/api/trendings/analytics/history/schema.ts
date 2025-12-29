import { z } from "zod"

/** 历史数据查询参数 */
export const AnalyticsHistoryReq = z.object({
  trendingIds: z.string().min(1, "请选择至少一个 IP").transform((v) => v.split(",")),
  days: z.coerce.number().min(7).max(90).default(30),
  source: z
    .enum(["ALL", "REDDIT", "GOOGLE_TRENDS", "ANILIST", "TWITTER", "BILIBILI"])
    .default("ALL"),
  region: z.string().default("GLOBAL"),
})

export type AnalyticsHistoryReqType = z.infer<typeof AnalyticsHistoryReq>
