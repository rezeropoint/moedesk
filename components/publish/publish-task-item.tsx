"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Instagram, Youtube, AtSign, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublishTask, PublishPlatform } from "@/types/publish"
import { STATUS_CONFIGS } from "@/types/publish"

interface PublishTaskItemProps {
  task: PublishTask
  isSelected: boolean
  onSelect: (task: PublishTask) => void
}

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

const platformColors: Record<PublishPlatform, string> = {
  INSTAGRAM: "text-brand-instagram",
  THREADS: "text-brand-threads",
  YOUTUBE: "text-brand-youtube",
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PublishTaskItem({
  task,
  isSelected,
  onSelect,
}: PublishTaskItemProps) {
  const statusConfig = STATUS_CONFIGS[task.status]

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      )}
      onClick={() => onSelect(task)}
    >
      {/* 封面 */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {task.coverUrl ? (
          <Image
            src={task.coverUrl}
            alt={task.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Youtube className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* 第一行：标题 */}
        <h4 className="font-medium text-sm leading-tight truncate">
          {task.title}
        </h4>

        {/* 第二行：系列 + 时间 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.seriesTitle && (
            <>
              <span className="truncate max-w-[100px]">{task.seriesTitle}</span>
              <span>·</span>
            </>
          )}
          <span>{formatDate(task.createdAt)}</span>
        </div>

        {/* 第三行：平台图标 + 状态 + 排期时间 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 平台图标 */}
            <div className="flex items-center gap-1">
              {task.platforms.map((platform) => {
                const Icon = platformIcons[platform]
                return (
                  <Icon
                    key={platform}
                    className={cn("h-3.5 w-3.5", platformColors[platform])}
                  />
                )
              })}
            </div>

            {/* 状态徽章 */}
            <Badge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0">
              {statusConfig.label}
            </Badge>
          </div>

          {/* 排期时间 */}
          {task.scheduledAt && task.status === "SCHEDULED" && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(task.scheduledAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
