/**
 * 工作流切换 API Schema
 */

import { z } from "zod"

/**
 * 切换工作流状态请求体
 */
export const WorkflowToggleReq = z.object({
  active: z.boolean(),
})

export type WorkflowToggleReqType = z.infer<typeof WorkflowToggleReq>
