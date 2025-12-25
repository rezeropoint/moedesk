/**
 * 热点雷达右侧面板容器
 */

import { AnimeSchedule } from "./anime-schedule"
import { ProductMatchPanel } from "./product-match-panel"
import { MonitorSettingsPanel } from "./monitor-settings-panel"

interface AnimeItem {
  id: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  metadata: {
    seasonYear?: number
    season?: string
    episodes?: number
  } | null
}

interface TrendingSidePanelProps {
  animeSchedule: AnimeItem[]
}

export function TrendingSidePanel({ animeSchedule }: TrendingSidePanelProps) {
  return (
    <div className="space-y-5">
      <AnimeSchedule items={animeSchedule} />
      <ProductMatchPanel />
      <MonitorSettingsPanel />
    </div>
  )
}
