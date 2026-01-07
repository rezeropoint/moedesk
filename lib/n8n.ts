/**
 * n8n API 封装
 */

import type {
  N8NWorkflow,
  N8NExecution,
  WorkflowRuntimeState,
  WorkflowStats,
  ExecutionLogQuery,
  ExecutionLogResponse,
  SOPWorkflowDefinition,
  SOPPhase,
  PhaseConfig,
} from "@/types/workflow"

/**
 * n8n API 配置
 */
const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678"
const N8N_API_KEY = process.env.N8N_API_KEY || ""

/**
 * SOP 工作流静态配置
 * 定义所有预期的工作流及其元数据
 */
export const SOP_WORKFLOW_DEFINITIONS: SOPWorkflowDefinition[] = [
  // 阶段一：内容生产
  {
    id: "sop-01-anilist-sync",
    sopId: "SOP-01",
    name: "AniList 新番同步",
    description: "每周自动同步 AniList 当季新番数据",
    phase: "content_production",
    triggerType: "schedule",
    triggerConfig: "每周一 09:00 UTC",
  },
  {
    id: "sop-01-ann-rss",
    sopId: "SOP-01",
    name: "ANN RSS 订阅",
    description: "订阅 Anime News Network 新闻更新",
    phase: "content_production",
    triggerType: "schedule",
    triggerConfig: "每 4 小时",
  },
  {
    id: "sop-02-reddit-monitor",
    sopId: "SOP-02",
    name: "Reddit 热度监测",
    description: "监测 Reddit r/anime 讨论热度",
    phase: "content_production",
    triggerType: "schedule",
    triggerConfig: "每日 05:00",
  },
  {
    id: "sop-02-google-trends",
    sopId: "SOP-02",
    name: "Google Trends 追踪",
    description: "追踪动漫相关搜索趋势",
    phase: "content_production",
    triggerType: "schedule",
    triggerConfig: "每日 04:00",
  },
  {
    id: "sop-03-topic-scoring",
    sopId: "SOP-03",
    name: "选题评分",
    description: "AI 评估选题商业价值和可行性",
    phase: "content_production",
    triggerType: "webhook",
  },
  {
    id: "sop-04-content-generate",
    sopId: "SOP-04",
    name: "内容生成",
    description: "AI 生成图文/视频脚本初稿",
    phase: "content_production",
    triggerType: "webhook",
  },
  {
    id: "sop-04-image-generate",
    sopId: "SOP-04",
    name: "配图生成",
    description: "AI 生成内容配图",
    phase: "content_production",
    triggerType: "webhook",
  },

  // 阶段二：内容分发
  {
    id: "sop-05-content-adapt",
    sopId: "SOP-05",
    name: "多平台适配",
    description: "将内容转换为各平台最佳格式",
    phase: "content_distribution",
    triggerType: "webhook",
  },
  {
    id: "sop-06-schedule-publish",
    sopId: "SOP-06",
    name: "定时发布",
    description: "检查并执行到期的定时发布任务",
    phase: "content_distribution",
    triggerType: "schedule",
    triggerConfig: "每分钟",
  },
  {
    id: "sop-07-data-collect",
    sopId: "SOP-07",
    name: "数据采集",
    description: "采集各平台内容表现数据",
    phase: "content_distribution",
    triggerType: "schedule",
    triggerConfig: "每 6 小时",
  },

  // 阶段三：用户互动
  {
    id: "sop-08-message-classify",
    sopId: "SOP-08",
    name: "消息分类",
    description: "AI 自动分类社媒消息类型和优先级",
    phase: "user_interaction",
    triggerType: "webhook",
  },
  {
    id: "sop-08-auto-reply",
    sopId: "SOP-08",
    name: "自动回复",
    description: "自动回复常见问题",
    phase: "user_interaction",
    triggerType: "webhook",
  },
  {
    id: "sop-09-lead-scoring",
    sopId: "SOP-09",
    name: "意向评分",
    description: "评估用户购买意向",
    phase: "user_interaction",
    triggerType: "webhook",
  },
  {
    id: "sop-09-guide-reply",
    sopId: "SOP-09",
    name: "引导话术",
    description: "生成引导进站的个性化话术",
    phase: "user_interaction",
    triggerType: "webhook",
  },
  {
    id: "sop-10-sentiment-alert",
    sopId: "SOP-10",
    name: "舆情告警",
    description: "负面评论检测和告警通知",
    phase: "user_interaction",
    triggerType: "webhook",
  },

  // 阶段四：转化闭环
  {
    id: "sop-11-koc-discover",
    sopId: "SOP-11",
    name: "KOC 发现",
    description: "发现潜在 KOC 合作对象",
    phase: "conversion_loop",
    triggerType: "schedule",
    triggerConfig: "每日",
  },
  {
    id: "sop-11-invite-template",
    sopId: "SOP-11",
    name: "邀约模板",
    description: "生成 KOC 邀约模板",
    phase: "conversion_loop",
    triggerType: "webhook",
  },
  {
    id: "sop-12-ugc-collect",
    sopId: "SOP-12",
    name: "UGC 收集",
    description: "收集用户原创内容",
    phase: "conversion_loop",
    triggerType: "schedule",
    triggerConfig: "每日",
  },
  {
    id: "sop-13-attribution",
    sopId: "SOP-13",
    name: "效果归因",
    description: "计算渠道贡献度和 ROI",
    phase: "conversion_loop",
    triggerType: "schedule",
    triggerConfig: "每周",
  },
  {
    id: "sop-13-weekly-report",
    sopId: "SOP-13",
    name: "周报生成",
    description: "自动生成运营周报",
    phase: "conversion_loop",
    triggerType: "schedule",
    triggerConfig: "每周五 18:00",
  },
]

/**
 * 阶段配置
 */
export const PHASE_CONFIG: Record<SOPPhase, PhaseConfig> = {
  content_production: {
    label: "内容生产",
    description: "热点监测、选题决策、内容生成",
  },
  content_distribution: {
    label: "内容分发",
    description: "多平台适配、定时发布、数据追踪",
  },
  user_interaction: {
    label: "用户互动",
    description: "消息分流、意向识别、舆情处理",
  },
  conversion_loop: {
    label: "转化闭环",
    description: "KOC 邀约、UGC 回收、效果归因",
  },
}

/**
 * n8n API 请求封装
 */
async function n8nFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(N8N_API_KEY && { "X-N8N-API-KEY": N8N_API_KEY }),
      ...options.headers,
    },
    // 服务端缓存策略
    next: { revalidate: 60 }, // 60 秒缓存
  })

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取所有 n8n 工作流
 */
export async function getN8NWorkflows(): Promise<N8NWorkflow[]> {
  try {
    const data = await n8nFetch<{ data: N8NWorkflow[] }>("/workflows")
    return data.data
  } catch (error) {
    console.error("Failed to fetch n8n workflows:", error)
    return []
  }
}

/**
 * 获取单个工作流详情
 */
export async function getN8NWorkflow(id: string): Promise<N8NWorkflow | null> {
  try {
    return await n8nFetch<N8NWorkflow>(`/workflows/${id}`)
  } catch (error) {
    console.error(`Failed to fetch workflow ${id}:`, error)
    return null
  }
}

/**
 * 获取工作流执行记录
 */
export async function getN8NExecutions(
  query: ExecutionLogQuery
): Promise<ExecutionLogResponse> {
  try {
    const params = new URLSearchParams({
      limit: String(query.limit || 20),
      ...(query.workflowId && { workflowId: query.workflowId }),
      ...(query.status && { status: query.status }),
    })

    const data = await n8nFetch<{ data: N8NExecution[]; nextCursor?: string }>(
      `/executions?${params}`
    )

    return {
      executions: data.data,
      total: data.data.length,
      hasMore: !!data.nextCursor,
    }
  } catch (error) {
    console.error("Failed to fetch executions:", error)
    return { executions: [], total: 0, hasMore: false }
  }
}

/**
 * 获取单个执行详情
 */
export async function getN8NExecution(id: string): Promise<N8NExecution | null> {
  try {
    return await n8nFetch<N8NExecution>(`/executions/${id}`)
  } catch (error) {
    console.error(`Failed to fetch execution ${id}:`, error)
    return null
  }
}

/**
 * 根据工作流名称匹配 n8n 工作流
 * 匹配规则：n8n 工作流名称包含 SOP 工作流 ID
 */
function matchN8NWorkflow(
  sopWorkflowId: string,
  n8nWorkflows: N8NWorkflow[]
): N8NWorkflow | undefined {
  return n8nWorkflows.find(
    (w) =>
      w.name.toLowerCase().includes(sopWorkflowId.toLowerCase()) ||
      w.tags?.some((t) => t.name.toLowerCase() === sopWorkflowId.toLowerCase())
  )
}

/**
 * 获取工作流运行时状态
 */
export async function getWorkflowRuntimeStates(): Promise<
  Map<string, WorkflowRuntimeState>
> {
  const [n8nWorkflows, allExecutions] = await Promise.all([
    getN8NWorkflows(),
    getN8NExecutions({ workflowId: "", limit: 100 }),
  ])

  const stateMap = new Map<string, WorkflowRuntimeState>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const definition of SOP_WORKFLOW_DEFINITIONS) {
    const matchedWorkflow = matchN8NWorkflow(definition.id, n8nWorkflows)
    const workflowExecutions = matchedWorkflow
      ? allExecutions.executions.filter(
          (e) => e.workflowId === matchedWorkflow.id
        )
      : []

    // 计算执行统计
    const todayExecutions = workflowExecutions.filter(
      (e) => new Date(e.startedAt) >= today
    )
    const successCount = workflowExecutions.filter(
      (e) => e.status === "success"
    ).length
    const failedCount = workflowExecutions.filter(
      (e) => e.status === "error"
    ).length

    // 最近一次执行
    const lastExecution = workflowExecutions[0]

    // 判断状态
    let status: WorkflowRuntimeState["status"] = "inactive"
    if (matchedWorkflow) {
      if (!matchedWorkflow.active) {
        status = "inactive"
      } else if (
        lastExecution?.status === "error" &&
        new Date(lastExecution.startedAt) >= today
      ) {
        status = "error"
      } else {
        status = "active"
      }
    }

    stateMap.set(definition.id, {
      workflowId: definition.id,
      n8nWorkflowId: matchedWorkflow?.id,
      status,
      isConfigured: !!matchedWorkflow,
      lastExecution: lastExecution
        ? {
            id: lastExecution.id,
            status: lastExecution.status,
            startedAt: lastExecution.startedAt,
            stoppedAt: lastExecution.stoppedAt,
            duration: lastExecution.stoppedAt
              ? new Date(lastExecution.stoppedAt).getTime() -
                new Date(lastExecution.startedAt).getTime()
              : undefined,
            error: lastExecution.data?.resultData?.error?.message,
          }
        : undefined,
      executionStats: {
        total: workflowExecutions.length,
        success: successCount,
        failed: failedCount,
        todayCount: todayExecutions.length,
      },
    })
  }

  return stateMap
}

/**
 * 计算工作流统计概览
 */
export async function getWorkflowStats(): Promise<WorkflowStats> {
  const runtimeStates = await getWorkflowRuntimeStates()

  let active = 0
  let inactive = 0
  let error = 0
  let todayExecutions = 0
  let totalExecutions = 0
  let successExecutions = 0

  for (const state of runtimeStates.values()) {
    switch (state.status) {
      case "active":
        active++
        break
      case "inactive":
        inactive++
        break
      case "error":
        error++
        break
    }
    todayExecutions += state.executionStats.todayCount
    totalExecutions += state.executionStats.total
    successExecutions += state.executionStats.success
  }

  return {
    total: SOP_WORKFLOW_DEFINITIONS.length,
    active,
    inactive,
    error,
    todayExecutions,
    successRate:
      totalExecutions > 0
        ? Math.round((successExecutions / totalExecutions) * 100)
        : 100,
  }
}

/**
 * 获取 n8n 编辑器 URL
 */
export function getN8NEditorUrl(n8nWorkflowId?: string): string {
  const baseUrl = N8N_BASE_URL.replace(/:\d+$/, ":5678") // 确保使用 n8n 端口
  if (n8nWorkflowId) {
    return `${baseUrl}/workflow/${n8nWorkflowId}`
  }
  return `${baseUrl}/workflows`
}

/**
 * 获取执行详情 URL
 */
export function getExecutionUrl(executionId: string): string {
  const baseUrl = N8N_BASE_URL.replace(/:\d+$/, ":5678")
  return `${baseUrl}/execution/${executionId}`
}

/**
 * 触发 n8n Webhook 工作流
 */
export async function triggerWorkflow<T>(
  workflow: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const response = await fetch(`${N8N_BASE_URL}/webhook/${workflow}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`Workflow ${workflow} failed: ${errorText}`)
  }

  // 处理空响应或非 JSON 响应
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    console.warn(`Workflow ${workflow} returned non-JSON response:`, text)
    return null
  }
}

/**
 * 激活/停用 n8n 工作流
 * @param id n8n 工作流 ID
 * @param active 是否激活
 * @returns 更新后的工作流信息
 */
export async function toggleN8NWorkflow(
  id: string,
  active: boolean
): Promise<N8NWorkflow | null> {
  try {
    // n8n API: POST /workflows/{id}/activate 或 /workflows/{id}/deactivate
    const endpoint = active
      ? `/workflows/${id}/activate`
      : `/workflows/${id}/deactivate`

    return await n8nFetch<N8NWorkflow>(endpoint, {
      method: "POST",
      // 绕过缓存，确保获取最新状态
      next: { revalidate: 0 },
    })
  } catch (error) {
    console.error(
      `Failed to ${active ? "activate" : "deactivate"} workflow ${id}:`,
      error
    )
    return null
  }
}
