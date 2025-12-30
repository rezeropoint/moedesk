"use client"

/**
 * 数据粒度标签组件
 * 用于标注数据是「系列级」还是「季度级」
 */

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface DataLevelBadgeProps {
  level: "series" | "season"
  className?: string
}

const config = {
  series: {
    label: "系列级",
    description: "该数据基于整个系列（所有季度合计）",
    variant: "secondary" as const,
  },
  season: {
    label: "季度级",
    description: "该数据仅代表当前季度",
    variant: "outline" as const,
  },
}

export function DataLevelBadge({ level, className }: DataLevelBadgeProps) {
  const { label, description, variant } = config[level]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={variant}
          className={cn("text-xs px-1.5 py-0 cursor-help shrink-0", className)}
        >
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}
