"use client"

/**
 * 工作流列表表格组件
 */

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExternalLink, History, Clock, Zap, Calendar } from "lucide-react"
import {
  WorkflowStatusBadge,
  ExecutionStatusBadge,
} from "./workflow-status-badge"
import { ExecutionLogDialog } from "./execution-log-dialog"
import { getN8NEditorUrl } from "@/lib/n8n"
import { cn } from "@/lib/utils"
import type { WorkflowDisplayItem } from "@/types/workflow"

interface WorkflowTableProps {
  workflows: WorkflowDisplayItem[]
}

export function WorkflowTable({ workflows }: WorkflowTableProps) {
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowDisplayItem | null>(null)

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return "-"
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const handleOpenLog = (workflow: WorkflowDisplayItem) => {
    setSelectedWorkflow(workflow)
  }

  const handleCloseLog = (open: boolean) => {
    if (!open) {
      setSelectedWorkflow(null)
    }
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">SOP</TableHead>
              <TableHead>工作流</TableHead>
              <TableHead className="w-[100px]">触发方式</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[140px]">最近执行</TableHead>
              <TableHead className="w-[120px]">执行统计</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>
                  <Badge variant="outline">{workflow.sopId}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {workflow.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "gap-1",
                            workflow.triggerType === "webhook" &&
                              "bg-type-anime-bg text-type-anime hover:bg-type-anime-bg"
                          )}
                        >
                          {workflow.triggerType === "schedule" ? (
                            <Calendar className="h-3 w-3" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                          {workflow.triggerType === "schedule"
                            ? "定时"
                            : "Webhook"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {workflow.triggerConfig || "Webhook 触发"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <WorkflowStatusBadge
                    status={workflow.runtime.status}
                    isConfigured={workflow.runtime.isConfigured}
                  />
                </TableCell>
                <TableCell>
                  {workflow.runtime.lastExecution ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ExecutionStatusBadge
                          status={workflow.runtime.lastExecution.status}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(workflow.runtime.lastExecution.startedAt)}
                        <span className="text-muted-foreground/60">
                          (
                          {formatDuration(
                            workflow.runtime.lastExecution.duration
                          )}
                          )
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="text-status-success">
                      {workflow.runtime.executionStats.success}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">
                      {workflow.runtime.executionStats.failed}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      (共 {workflow.runtime.executionStats.total})
                    </span>
                  </div>
                  {workflow.runtime.executionStats.todayCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      今日 {workflow.runtime.executionStats.todayCount} 次
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenLog(workflow)}
                            disabled={!workflow.runtime.isConfigured}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>查看执行日志</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm" asChild>
                            <a
                              href={getN8NEditorUrl(
                                workflow.runtime.n8nWorkflowId
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {workflow.runtime.isConfigured
                            ? "在 n8n 中编辑"
                            : "打开 n8n"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExecutionLogDialog
        workflow={selectedWorkflow}
        open={!!selectedWorkflow}
        onOpenChange={handleCloseLog}
      />
    </>
  )
}
