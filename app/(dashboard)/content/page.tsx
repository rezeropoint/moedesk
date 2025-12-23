import { Calendar } from "lucide-react"

export default function ContentPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">内容日历</h1>
          <p className="text-muted-foreground">规划和排期社媒内容发布</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">暂无排期内容</h2>
        <p className="text-muted-foreground">
          创建内容后，排期将显示在日历中
        </p>
      </div>
    </div>
  )
}
