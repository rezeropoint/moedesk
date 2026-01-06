"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Instagram, Youtube, AtSign, ExternalLink } from "lucide-react"
import type { PublishRecord, PublishPlatform } from "@/types/publish"
import { PLATFORM_CONFIGS, STATUS_CONFIGS } from "@/types/publish"

interface PublishRecordTableProps {
  records: PublishRecord[]
  taskTitles?: Record<string, string> // taskId -> title 映射
}

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PublishRecordTable({
  records,
  taskTitles = {},
}: PublishRecordTableProps) {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        暂无发布记录
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[140px]">时间</TableHead>
          <TableHead>内容</TableHead>
          <TableHead className="w-[100px]">平台</TableHead>
          <TableHead className="w-[80px]">状态</TableHead>
          <TableHead className="w-[80px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const platformConfig = PLATFORM_CONFIGS[record.platform]
          const Icon = platformIcons[record.platform]
          const statusConfig = STATUS_CONFIGS[record.status]
          const taskTitle = taskTitles[record.taskId] || record.taskId

          return (
            <TableRow key={record.id}>
              <TableCell className="text-muted-foreground">
                {formatDateTime(record.publishedAt || record.createdAt)}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate" title={taskTitle}>
                  {taskTitle}
                </div>
                {record.errorMessage && (
                  <p className="text-xs text-destructive mt-1 truncate" title={record.errorMessage}>
                    {record.errorMessage}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${platformConfig.colorClass}`} />
                  <span className="text-sm">{platformConfig.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {record.externalUrl ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    asChild
                  >
                    <a
                      href={record.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      查看
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
