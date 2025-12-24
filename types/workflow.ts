/**
 * 工作流相关类型定义
 */

/**
 * SOP 阶段枚举
 */
export type SOPPhase =
  | "content_production"   // 阶段一：内容生产
  | "content_distribution" // 阶段二：内容分发
  | "user_interaction"     // 阶段三：用户互动
  | "conversion_loop"      // 阶段四：转化闭环

/**
 * 工作流触发类型
 */
export type WorkflowTriggerType = "schedule" | "webhook"

/**
 * 工作流状态
 */
export type WorkflowStatus = "active" | "inactive" | "error"

/**
 * 执行状态
 */
export type ExecutionStatus = "success" | "error" | "running" | "waiting"

/**
 * SOP 工作流定义（静态配置）
 */
export interface SOPWorkflowDefinition {
  id: string                        // 工作流 ID，如 "sop-01-anilist-sync"
  sopId: string                     // SOP 编号，如 "SOP-01"
  name: string                      // 工作流名称
  description: string               // 功能描述
  phase: SOPPhase                   // 所属阶段
  triggerType: WorkflowTriggerType
  triggerConfig?: string            // 触发配置描述，如 "每周一 09:00"
}

/**
 * n8n 工作流信息（来自 API）
 */
export interface N8NWorkflow {
  id: string                        // n8n 内部 ID
  name: string                      // 工作流名称
  active: boolean                   // 是否激活
  createdAt: string                 // 创建时间
  updatedAt: string                 // 更新时间
  nodes?: N8NNode[]                 // 节点列表（简化）
  tags?: N8NTag[]                   // 标签
}

export interface N8NNode {
  name: string
  type: string
  position: [number, number]
}

export interface N8NTag {
  id: string
  name: string
}

/**
 * n8n 执行记录
 */
export interface N8NExecution {
  id: string                        // 执行 ID
  workflowId: string                // 工作流 ID
  status: ExecutionStatus           // 执行状态
  startedAt: string                 // 开始时间
  stoppedAt?: string                // 结束时间
  mode: "manual" | "trigger" | "webhook"
  retryOf?: string                  // 重试来源
  retrySuccessId?: string           // 重试成功 ID
  data?: {
    resultData?: {
      error?: {
        message: string
        stack?: string
      }
    }
  }
}

/**
 * 最近执行信息
 */
export interface LastExecution {
  id: string
  status: ExecutionStatus
  startedAt: string
  stoppedAt?: string
  duration?: number                 // 执行时长（毫秒）
  error?: string
}

/**
 * 执行统计
 */
export interface ExecutionStats {
  total: number                     // 总执行次数
  success: number                   // 成功次数
  failed: number                    // 失败次数
  todayCount: number                // 今日执行次数
}

/**
 * 工作流运行时状态（聚合视图）
 */
export interface WorkflowRuntimeState {
  workflowId: string                // SOP 工作流 ID
  n8nWorkflowId?: string            // n8n 内部 ID（可能未配置）
  status: WorkflowStatus            // 当前状态
  isConfigured: boolean             // 是否已在 n8n 中配置
  lastExecution?: LastExecution
  executionStats: ExecutionStats
}

/**
 * 页面展示用的工作流数据
 */
export interface WorkflowDisplayItem extends SOPWorkflowDefinition {
  runtime: WorkflowRuntimeState
}

/**
 * 工作流统计概览
 */
export interface WorkflowStats {
  total: number                     // 总工作流数
  active: number                    // 活跃数
  inactive: number                  // 停用数
  error: number                     // 错误数
  todayExecutions: number           // 今日执行总数
  successRate: number               // 成功率（百分比）
}

/**
 * 执行日志查询参数
 */
export interface ExecutionLogQuery {
  workflowId: string
  limit?: number
  offset?: number
  status?: ExecutionStatus
}

/**
 * 执行日志响应
 */
export interface ExecutionLogResponse {
  executions: N8NExecution[]
  total: number
  hasMore: boolean
  message?: string
}

/**
 * 阶段配置
 */
export interface PhaseConfig {
  label: string
  description: string
}
