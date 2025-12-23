import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">数据报表</h1>
          <p className="text-muted-foreground">查看运营数据和业绩分析</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">暂无数据</h2>
        <p className="text-muted-foreground">
          开始运营后，数据报表将自动生成
        </p>
      </div>
    </div>
  )
}
