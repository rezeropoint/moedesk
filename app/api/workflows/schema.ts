/**
 * 工作流 API Schema 定义
 */

import { z } from "zod"

/**
 * 工作流列表请求参数（当前无需参数，预留扩展）
 */
export const WorkflowListReq = z.object({
  phase: z
    .enum([
      "content_production",
      "content_distribution",
      "user_interaction",
      "conversion_loop",
    ])
    .optional(),
})

/**
 * 执行日志请求参数
 */
export const ExecutionListReq = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["success", "error", "running", "waiting"]).optional(),
})

/**
 * 工作流状态
 */
export const WorkflowStatusSchema = z.enum(["active", "inactive", "error"])

/**
 * 执行状态
 */
export const ExecutionStatusSchema = z.enum([
  "success",
  "error",
  "running",
  "waiting",
])

/**
 * 执行统计
 */
export const ExecutionStatsItem = z.object({
  total: z.number(),
  success: z.number(),
  failed: z.number(),
  todayCount: z.number(),
})

/**
 * 最近执行信息
 */
export const LastExecutionItem = z.object({
  id: z.string(),
  status: ExecutionStatusSchema,
  startedAt: z.string(),
  stoppedAt: z.string().optional(),
  duration: z.number().optional(),
  error: z.string().optional(),
})

/**
 * 工作流运行时状态
 */
export const WorkflowRuntimeItem = z.object({
  workflowId: z.string(),
  n8nWorkflowId: z.string().optional(),
  status: WorkflowStatusSchema,
  isConfigured: z.boolean(),
  lastExecution: LastExecutionItem.optional(),
  executionStats: ExecutionStatsItem,
})

/**
 * 工作流展示项
 */
export const WorkflowItem = z.object({
  id: z.string(),
  sopId: z.string(),
  name: z.string(),
  description: z.string(),
  phase: z.enum([
    "content_production",
    "content_distribution",
    "user_interaction",
    "conversion_loop",
  ]),
  triggerType: z.enum(["schedule", "webhook"]),
  triggerConfig: z.string().optional(),
  runtime: WorkflowRuntimeItem,
})

/**
 * 工作流统计概览
 */
export const WorkflowStatsItem = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  error: z.number(),
  todayExecutions: z.number(),
  successRate: z.number(),
})

/**
 * 工作流列表响应
 */
export const WorkflowListResp = z.object({
  workflows: z.array(WorkflowItem),
  stats: WorkflowStatsItem,
})

/**
 * n8n 执行记录
 */
export const N8NExecutionItem = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: ExecutionStatusSchema,
  startedAt: z.string(),
  stoppedAt: z.string().optional(),
  mode: z.enum(["manual", "trigger", "webhook"]),
  retryOf: z.string().optional(),
  retrySuccessId: z.string().optional(),
  data: z
    .object({
      resultData: z
        .object({
          error: z
            .object({
              message: z.string(),
              stack: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
})

/**
 * 执行日志响应
 */
export const ExecutionListResp = z.object({
  executions: z.array(N8NExecutionItem),
  total: z.number(),
  hasMore: z.boolean(),
  message: z.string().optional(),
})

// 导出类型
export type WorkflowListReqType = z.infer<typeof WorkflowListReq>
export type ExecutionListReqType = z.infer<typeof ExecutionListReq>
export type WorkflowItemType = z.infer<typeof WorkflowItem>
export type WorkflowStatsItemType = z.infer<typeof WorkflowStatsItem>
export type N8NExecutionItemType = z.infer<typeof N8NExecutionItem>
