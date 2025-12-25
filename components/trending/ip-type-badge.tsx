/**
 * IP 类型徽章组件
 */

import { Badge } from "@/components/ui/badge"
import type { IpType } from "@/types/trending"

const TYPE_CONFIG: Record<IpType, { label: string; className: string }> = {
  ANIME: {
    label: "番剧",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  GAME: {
    label: "游戏",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  MANGA: {
    label: "漫画",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  LIGHT_NOVEL: {
    label: "轻小说",
    className: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  },
  VTUBER: {
    label: "VTuber",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  MOVIE: {
    label: "剧场版",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  OTHER: {
    label: "其他",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  },
}

interface IpTypeBadgeProps {
  type: IpType
}

export function IpTypeBadge({ type }: IpTypeBadgeProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}
