"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { PublishTaskItem } from "./publish-task-item"
import type { PublishTask } from "@/types/publish"
import { STATUS_CONFIGS } from "@/types/publish"

interface PublishTaskListProps {
  tasks: PublishTask[]
  selectedTask: PublishTask | null
  onSelectTask: (task: PublishTask) => void
}

const statusOptions: { value: string; label: string }[] = [
  { value: "ALL", label: "全部状态" },
  ...Object.entries(STATUS_CONFIGS).map(([value, config]) => ({
    value,
    label: config.label,
  })),
]

export function PublishTaskList({
  tasks,
  selectedTask,
  onSelectTask,
}: PublishTaskListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // 筛选任务
  const filteredTasks = tasks.filter((task) => {
    // 状态筛选
    if (statusFilter !== "ALL" && task.status !== statusFilter) {
      return false
    }
    // 搜索筛选
    if (search) {
      const lowerSearch = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(lowerSearch) ||
        task.seriesTitle?.toLowerCase().includes(lowerSearch)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选 */}
      <div className="space-y-3 pb-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索任务..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 状态筛选 */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 任务列表 */}
      <ScrollArea className="flex-1 -mx-2">
        <div className="space-y-1 px-2">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "没有符合条件的任务"
                : "暂无发布任务"}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <PublishTaskItem
                key={task.id}
                task={task}
                isSelected={selectedTask?.id === task.id}
                onSelect={onSelectTask}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* 统计 */}
      <div className="pt-3 border-t text-xs text-muted-foreground">
        共 {filteredTasks.length} 个任务
        {(search || statusFilter !== "ALL") && ` (筛选自 ${tasks.length} 个)`}
      </div>
    </div>
  )
}
