/**
 * 热点雷达右侧面板容器
 */

import { HeatSurgePanel } from "./heat-surge-panel"
import { EndingSoonPanel } from "./ending-soon-panel"
import { ProductMatchPanel } from "./product-match-panel"
import { MonitorSettingsPanel } from "./monitor-settings-panel"

interface EndingSoonItem {
  id: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  endDate: string
  daysRemaining: number
}

interface TrendingSidePanelProps {
  endingSoonItems: EndingSoonItem[]
}

export function TrendingSidePanel({ endingSoonItems }: TrendingSidePanelProps) {
  return (
    <div className="space-y-5">
      <HeatSurgePanel />
      <EndingSoonPanel items={endingSoonItems} />
      <ProductMatchPanel />
      <MonitorSettingsPanel />
    </div>
  )
}
