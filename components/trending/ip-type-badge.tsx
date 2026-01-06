/**
 * IP 类型徽章组件
 */

import { Badge } from "@/components/ui/badge"
import type { IpType } from "@/types/trending"

const TYPE_CONFIG: Record<IpType, { label: string; className: string }> = {
  ANIME: {
    label: "番剧",
    className: "bg-type-anime-bg text-type-anime hover:bg-type-anime-bg",
  },
  GAME: {
    label: "游戏",
    className: "bg-type-game-bg text-type-game hover:bg-type-game-bg",
  },
  MANGA: {
    label: "漫画",
    className: "bg-type-manga-bg text-type-manga hover:bg-type-manga-bg",
  },
  LIGHT_NOVEL: {
    label: "轻小说",
    className: "bg-type-novel-bg text-type-novel hover:bg-type-novel-bg",
  },
  VTUBER: {
    label: "VTuber",
    className: "bg-type-vtuber-bg text-type-vtuber hover:bg-type-vtuber-bg",
  },
  MOVIE: {
    label: "剧场版",
    className: "bg-type-movie-bg text-type-movie hover:bg-type-movie-bg",
  },
  OTHER: {
    label: "其他",
    className: "bg-type-other-bg text-type-other hover:bg-type-other-bg",
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
