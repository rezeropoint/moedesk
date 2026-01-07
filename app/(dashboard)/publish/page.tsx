"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Send, Loader2 } from "lucide-react"
import { PublishStatsCards } from "@/components/publish/publish-stats-cards"
import { PublishTaskList } from "@/components/publish/publish-task-list"
import { PublishTaskDetail } from "@/components/publish/publish-task-detail"
import { PublishRecordTable } from "@/components/publish/publish-record-table"
import { CreateTaskDialog } from "@/components/publish/create-task-dialog"
import type { PublishTask, PublishStats, PublishRecord } from "@/types/publish"

export default function PublishPage() {
  const [tasks, setTasks] = useState<PublishTask[]>([])
  const [stats, setStats] = useState<PublishStats>({
    draft: 0,
    scheduled: 0,
    publishedToday: 0,
    failed: 0,
  })
  const [selectedTask, setSelectedTask] = useState<PublishTask | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 获取任务列表
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/publish?pageSize=50")
      if (response.ok) {
        const result = await response.json()
        setTasks(result.data.items)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }, [])

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/publish/stats")
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }, [])

  // 从任务中提取所有发布记录（使用 useMemo 而非 useEffect + setState）
  const records = useMemo(() => {
    const allRecords: PublishRecord[] = []
    for (const task of tasks) {
      if (task.records) {
        allRecords.push(...task.records)
      }
    }
    // 按创建时间降序排序
    allRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return allRecords.slice(0, 20) // 最多显示 20 条
  }, [tasks])

  // 初始加载
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      await Promise.all([fetchTasks(), fetchStats()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchTasks, fetchStats])

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([fetchTasks(), fetchStats()])
    setIsRefreshing(false)
  }, [fetchTasks, fetchStats])

  // 任务创建成功回调
  const handleTaskCreated = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  // 任务更新回调
  const handleTaskUpdate = async () => {
    await handleRefresh()
    // 如果选中的任务被更新，重新获取最新数据
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id)
      if (updatedTask) {
        setSelectedTask(updatedTask)
      }
    }
  }

  // 任务删除回调
  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    if (selectedTask?.id === taskId) {
      setSelectedTask(null)
    }
    fetchStats() // 更新统计
  }

  // 构建 taskId -> title 映射
  const taskTitles = tasks.reduce(
    (acc, task) => {
      acc[task.id] = task.title
      return acc
    },
    {} as Record<string, string>
  )

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">发布中心</h1>
            <p className="text-muted-foreground">
              管理多平台内容发布任务
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
          <CreateTaskDialog onSuccess={handleTaskCreated} />
        </div>
      </div>

      {/* 统计卡片 */}
      <PublishStatsCards stats={stats} />

      {/* 主内容区：左右分栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* 左侧：任务列表 */}
        <Card className="h-[500px] overflow-hidden flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-base">待发布任务</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <PublishTaskList
              tasks={tasks}
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
            />
          </CardContent>
        </Card>

        {/* 右侧：任务详情 */}
        <Card className="h-[500px] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">任务详情</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] overflow-auto">
            <PublishTaskDetail
              task={selectedTask}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
            />
          </CardContent>
        </Card>
      </div>

      {/* 底部：发布记录 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">发布记录</CardTitle>
        </CardHeader>
        <CardContent>
          <PublishRecordTable records={records} taskTitles={taskTitles} />
        </CardContent>
      </Card>
    </div>
  )
}
