import { Flame } from "lucide-react"

export default function TrendingPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#7c3aed]/10 rounded-lg">
          <Flame className="h-6 w-6 text-[#7c3aed]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">热点雷达</h1>
          <p className="text-muted-foreground">追踪二次元领域热门话题和趋势</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-12 text-center">
        <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">暂无热点数据</h2>
        <p className="text-muted-foreground">
          配置数据源后，热点将自动更新
        </p>
      </div>
    </div>
  )
}
