import { z } from "zod"

/**
 * 飙升查询参数 Schema
 */
export const SurgeQuerySchema = z.object({
  threshold: z.coerce.number().min(0).max(1000).optional(),
  limit: z.coerce.number().min(1).max(20).optional(),
})
