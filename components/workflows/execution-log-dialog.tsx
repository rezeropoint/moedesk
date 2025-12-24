"use client"

/**
 * 执行日志弹窗组件
 */

import { useEffect, useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react"
import { ExecutionStatusBadge } from "./workflow-status-badge"
import { getExecutionUrl } from "@/lib/n8n"
import type { WorkflowDisplayItem, N8NExecution } from "@/types/workflow"

interface ExecutionLogDialogProps {
  workflow: WorkflowDisplayItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExecutionLogDialog({
  workflow,
  open,
  onOpenChange,
}: ExecutionLogDialogProps) {
  const [executions, setExecutions] = useState<N8NExecution[]>([])
  const [isLoading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleFetchExecutions = () => {
    if (!workflow) return

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/workflows/${workflow.id}/executions?limit=20`
        )
        if (!response.ok) throw new Error("获取执行日志失败")
        const result = await response.json()
        setExecutions(result.data?.executions || [])
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "未知错误")
      }
    })
  }

  useEffect(() => {
    if (open && workflow) {
      // 重置状态
      setExecutions([])
      setError(null)
      // 获取执行日志
      startTransition(async () => {
        try {
          const response = await fetch(
            `/api/workflows/${workflow.id}/executions?limit=20`
          )
          if (!response.ok) throw new Error("获取执行日志失败")
          const result = await response.json()
          setExecutions(result.data?.executions || [])
          setError(null)
        } catch (e) {
          setError(e instanceof Error ? e.message : "未知错误")
        }
      })
    }
  }, [open, workflow])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return "-"
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {workflow?.name} - 执行日志
            <Badge variant="outline">{workflow?.sopId}</Badge>
          </DialogTitle>
          <DialogDescription>{workflow?.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {executions.length} 条记录
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchExecutions}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">状态</TableHead>
                <TableHead className="w-[80px]">触发方式</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead className="w-[100px]">耗时</TableHead>
                <TableHead>错误信息</TableHead>
                <TableHead className="w-[60px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {isLoading ? "加载中..." : "暂无执行记录"}
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <ExecutionStatusBadge status={execution.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {execution.mode === "manual"
                          ? "手动"
                          : execution.mode === "webhook"
                          ? "Webhook"
                          : "定时"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatTime(execution.startedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDuration(execution.startedAt, execution.stoppedAt)}
                    </TableCell>
                    <TableCell>
                      {execution.data?.resultData?.error?.message ? (
                        <span className="text-destructive text-sm line-clamp-2">
                          {execution.data.resultData.error.message}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a
                          href={getExecutionUrl(execution.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
