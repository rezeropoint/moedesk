import { z } from "zod"

/** 搜索请求参数 */
export const TrendingSearchReq = z.object({
  q: z.string().min(1, "搜索关键词不能为空"),
  limit: z.coerce.number().min(1).max(20).default(10),
})

export type TrendingSearchReqType = z.infer<typeof TrendingSearchReq>
