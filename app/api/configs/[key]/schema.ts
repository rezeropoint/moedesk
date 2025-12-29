import { z } from "zod"

/**
 * 配置更新请求 Schema
 */
export const ConfigUpdateReq = z.object({
  value: z.record(z.string(), z.unknown()),
})

/**
 * 数据源权重配置 Schema
 */
export const SourceWeightsConfig = z.object({
  anilist: z.number().min(0).max(1).default(0.30),
  google: z.number().min(0).max(1).default(0.25),
  reddit: z.number().min(0).max(1).default(0.20),
  twitter: z.number().min(0).max(1).default(0.15),
  bilibili: z.number().min(0).max(1).default(0.10),
})

/**
 * 飙升配置 Schema（含阈值和权重）
 */
export const SurgeConfig = z.object({
  threshold: z.number().min(0).max(1000).default(50),
  limit: z.number().min(1).max(20).default(5),
  weights: SourceWeightsConfig.default({
    anilist: 0.30,
    google: 0.25,
    reddit: 0.20,
    twitter: 0.15,
    bilibili: 0.10,
  }),
})

export type SourceWeightsConfigType = z.infer<typeof SourceWeightsConfig>
export type SurgeConfigType = z.infer<typeof SurgeConfig>
