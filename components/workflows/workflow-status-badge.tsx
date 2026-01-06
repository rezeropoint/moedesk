/**
 * 工作流状态徽章组件
 */

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WorkflowStatus, ExecutionStatus } from "@/types/workflow"

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus
  isConfigured: boolean
}

export function WorkflowStatusBadge({
  status,
  isConfigured,
}: WorkflowStatusBadgeProps) {
  if (!isConfigured) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        未配置
      </Badge>
    )
  }

  const config = {
    active: {
      label: "活跃",
      variant: "default" as const,
      className: "bg-status-success hover:bg-status-success",
    },
    inactive: {
      label: "停用",
      variant: "secondary" as const,
      className: "",
    },
    error: {
      label: "错误",
      variant: "destructive" as const,
      className: "",
    },
  }

  const { label, variant, className } = config[status]

  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  )
}

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  const config = {
    success: {
      label: "成功",
      variant: "default" as const,
      className: "bg-status-success hover:bg-status-success",
    },
    error: {
      label: "失败",
      variant: "destructive" as const,
      className: "",
    },
    running: {
      label: "运行中",
      variant: "secondary" as const,
      className: "bg-status-info text-white hover:bg-status-info",
    },
    waiting: {
      label: "等待中",
      variant: "outline" as const,
      className: "",
    },
  }

  const { label, variant, className } = config[status]

  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  )
}
